import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NeedsService } from "../../financial/needs/services/needs.service";
import { MasterContract } from "../../financial/master-contracts/entities/master-contract.entity";
import { ContractCdpRelation } from "../../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { ExportResult } from "./export.types";
import { getExportDate } from "../../shared/helpers/export-columns.helper";

@Injectable()
export class NeedsExportBuilder {
  private readonly logger = new Logger(NeedsExportBuilder.name);

  constructor(
    private readonly needsService: NeedsService,
    @InjectRepository(MasterContract)
    private readonly masterContractRepository: Repository<MasterContract>,
    @InjectRepository(ContractCdpRelation)
    private readonly contractCdpRelationRepository: Repository<ContractCdpRelation>,
  ) {}

  async buildNeedsExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Necesidades");

    const search = filters?.search;

    // 1. Necesidades (tabla principal)
    const result = await this.needsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
      code: row.code ?? "",
      description: row.description ?? "",
      amount: row.amount ? Number(row.amount) : 0,
      previousStudyCode: row.previousStudy?.code ?? "",
      previousStudyStatus: row.previousStudy?.status ?? "",
    }));

    // 2. Contratos Marco asociados a Necesidades
    const contracts = await this.masterContractRepository
      .createQueryBuilder("mc")
      .leftJoin("mc.need", "need")
      .leftJoin("mc.contractor", "contractor")
      .select([
        "mc.id",
        "mc.number",
        "mc.object",
        "mc.totalValue",
        "mc.startDate",
        "mc.endDate",
        "mc.state",
        "need.code",
        "contractor.name",
        "contractor.nit",
      ])
      .orderBy("need.code", "ASC")
      .addOrderBy("mc.number", "ASC")
      .getMany();

    const contractsData = contracts.map((row: any) => ({
      needCode: row.need?.code ?? "",
      number: row.number ?? "",
      object: row.object ?? "",
      totalValue: row.totalValue ? Number(row.totalValue) : 0,
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : "",
      state: row.state ?? "",
      contractorName: row.contractor?.name ?? "",
      contractorNit: row.contractor?.nit ?? "",
    }));

    // 3. CDPs vinculados (a través de ContractCdpRelation → MasterContract → Need)
    const cdpRelations = await this.contractCdpRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.masterContract", "mc")
      .leftJoin("mc.need", "need")
      .leftJoin("rel.cdp", "cdp")
      .select([
        "rel.id",
        "need.code",
        "mc.number",
        "cdp.number",
        "cdp.totalValue",
        "cdp.balance",
        "cdp.dateIssue",
      ])
      .orderBy("need.code", "ASC")
      .addOrderBy("cdp.number", "ASC")
      .getMany();

    const cdpData = cdpRelations.map((row: any) => ({
      needCode: row.masterContract?.need?.code ?? "",
      contractNumber: row.masterContract?.number ?? "",
      cdpNumber: row.cdp?.number ?? "",
      cdpTotalValue: row.cdp?.totalValue ? Number(row.cdp.totalValue) : 0,
      cdpBalance: row.cdp?.balance ? Number(row.cdp.balance) : 0,
      cdpDateIssue: row.cdp?.dateIssue ? new Date(row.cdp.dateIssue).toISOString().slice(0, 10) : "",
    }));

    const now = getExportDate();

    return {
      fileName: `necesidades-${now}.xlsx`,
      sheets: [
        {
          name: "Necesidades",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Descripción", key: "description", width: 50 },
            { header: "Monto", key: "amount", width: 20, numFmt: "#,##0.00" },
            { header: "Estudio Previo (Código)", key: "previousStudyCode", width: 22 },
            { header: "Estudio Previo (Estado)", key: "previousStudyStatus", width: 22 },
          ],
          data,
        },
        {
          name: "Contratos Marco",
          columns: [
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
            { header: "Contrato #", key: "number", width: 18 },
            { header: "Objeto", key: "object", width: 45 },
            { header: "Valor Total", key: "totalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Inicio", key: "startDate", width: 15 },
            { header: "Fecha Fin", key: "endDate", width: 15 },
            { header: "Estado", key: "state", width: 15 },
            { header: "Contratista", key: "contractorName", width: 35 },
            { header: "NIT", key: "contractorNit", width: 18 },
          ],
          data: contractsData,
        },
        {
          name: "CDPs Vinculados",
          columns: [
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Valor CDP", key: "cdpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo CDP", key: "cdpBalance", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Expedición", key: "cdpDateIssue", width: 18 },
          ],
          data: cdpData,
        },
      ],
    };
  }
}
