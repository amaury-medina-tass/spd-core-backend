import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MasterContractsService } from "../../financial/master-contracts/services/master-contracts.service";
import { ContractCdpRelation } from "../../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { BudgetRecord } from "../../financial/budget-records/entities/budget-record.entity";
import { ContractPosition } from "../../financial/contract-positions/entities/contract-position.entity";
import { ExportResult } from "./export.types";
import { getExportDate } from "../../shared/helpers/export-columns.helper";

@Injectable()
export class ContractsExportBuilder {
  private readonly logger = new Logger(ContractsExportBuilder.name);

  constructor(
    private readonly masterContractsService: MasterContractsService,
    @InjectRepository(ContractCdpRelation)
    private readonly contractCdpRelationRepository: Repository<ContractCdpRelation>,
    @InjectRepository(BudgetRecord)
    private readonly budgetRecordRepository: Repository<BudgetRecord>,
    @InjectRepository(ContractPosition)
    private readonly contractPositionRepository: Repository<ContractPosition>,
  ) {}

  async buildContractsExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Contratos Marco");

    const search = filters?.search;

    // 1. Contratos Marco (tabla principal)
    const result = await this.masterContractsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "number",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
      number: row.number ?? "",
      object: row.object ?? "",
      totalValue: row.totalValue ? Number(row.totalValue) : 0,
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : "",
      state: row.state ?? "",
      contractorName: row.contractor?.name ?? "",
      contractorNit: row.contractor?.nit ?? "",
      needCode: row.need?.code ?? "",
    }));

    // 2. CDPs vinculados a contratos
    const cdpRelations = await this.contractCdpRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.masterContract", "mc")
      .leftJoin("rel.cdp", "cdp")
      .select([
        "rel.id",
        "mc.number",
        "cdp.number",
        "cdp.totalValue",
        "cdp.balance",
        "cdp.dateIssue",
      ])
      .orderBy("mc.number", "ASC")
      .addOrderBy("cdp.number", "ASC")
      .getMany();

    const cdpData = cdpRelations.map((row: any) => ({
      contractNumber: row.masterContract?.number ?? "",
      cdpNumber: row.cdp?.number ?? "",
      cdpTotalValue: row.cdp?.totalValue ? Number(row.cdp.totalValue) : 0,
      cdpBalance: row.cdp?.balance ? Number(row.cdp.balance) : 0,
      cdpDateIssue: row.cdp?.dateIssue ? new Date(row.cdp.dateIssue).toISOString().slice(0, 10) : "",
    }));

    // 3. Registros Presupuestales asociados a contratos
    const budgetRecords = await this.budgetRecordRepository
      .createQueryBuilder("br")
      .leftJoin("br.contract", "mc")
      .leftJoin("br.cdp", "cdp")
      .select([
        "br.id",
        "br.number",
        "br.totalValue",
        "br.balance",
        "mc.number",
        "cdp.number",
      ])
      .orderBy("mc.number", "ASC")
      .addOrderBy("br.number", "ASC")
      .getMany();

    const budgetRecordsData = budgetRecords.map((row: any) => ({
      contractNumber: row.contract?.number ?? "",
      rpNumber: row.number ?? "",
      rpTotalValue: row.totalValue ? Number(row.totalValue) : 0,
      rpBalance: row.balance ? Number(row.balance) : 0,
      cdpNumber: row.cdp?.number ?? "",
    }));

    // 4. Posiciones de Contrato
    const positions = await this.contractPositionRepository
      .createQueryBuilder("cp")
      .leftJoin("cp.contract", "mc")
      .leftJoin("cp.budgetRecord", "br")
      .leftJoin("cp.detailedActivity", "da")
      .leftJoin("cp.rubric", "rubric")
      .leftJoin("cp.fundingSource", "fs")
      .leftJoin("cp.project", "project")
      .select([
        "cp.id",
        "cp.positionNumber",
        "cp.value",
        "cp.allocatedValue",
        "cp.availableBalance",
        "cp.description",
        "mc.number",
        "br.number",
        "da.code",
        "da.name",
        "rubric.code",
        "fs.name",
        "project.code",
      ])
      .orderBy("mc.number", "ASC")
      .addOrderBy("cp.positionNumber", "ASC")
      .getMany();

    const positionsData = positions.map((row: any) => ({
      contractNumber: row.contract?.number ?? "",
      positionNumber: row.positionNumber ?? "",
      value: row.value ? Number(row.value) : 0,
      allocatedValue: row.allocatedValue ? Number(row.allocatedValue) : 0,
      availableBalance: row.availableBalance ? Number(row.availableBalance) : 0,
      description: row.description ?? "",
      rpNumber: row.budgetRecord?.number ?? "",
      activityCode: row.detailedActivity?.code ?? "",
      activityName: row.detailedActivity?.name ?? "",
      rubricCode: row.rubric?.code ?? "",
      fundingSourceName: row.fundingSource?.name ?? "",
      projectCode: row.project?.code ?? "",
    }));

    const now = getExportDate();

    return {
      fileName: `contratos-marco-${now}.xlsx`,
      sheets: [
        {
          name: "Contratos Marco",
          columns: [
            { header: "Número", key: "number", width: 18 },
            { header: "Objeto", key: "object", width: 50 },
            { header: "Valor Total", key: "totalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Inicio", key: "startDate", width: 15 },
            { header: "Fecha Fin", key: "endDate", width: 15 },
            { header: "Estado", key: "state", width: 15 },
            { header: "Contratista", key: "contractorName", width: 35 },
            { header: "NIT", key: "contractorNit", width: 18 },
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
          ],
          data,
        },
        {
          name: "CDPs Vinculados",
          columns: [
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Valor CDP", key: "cdpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo CDP", key: "cdpBalance", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Expedición", key: "cdpDateIssue", width: 18 },
          ],
          data: cdpData,
        },
        {
          name: "Registros Presupuestales",
          columns: [
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "RP #", key: "rpNumber", width: 18 },
            { header: "Valor Total RP", key: "rpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo RP", key: "rpBalance", width: 20, numFmt: "#,##0.00" },
            { header: "CDP #", key: "cdpNumber", width: 15 },
          ],
          data: budgetRecordsData,
        },
        {
          name: "Posiciones de Contrato",
          columns: [
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "Posición #", key: "positionNumber", width: 15 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
            { header: "Valor Asignado", key: "allocatedValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo Disponible", key: "availableBalance", width: 20, numFmt: "#,##0.00" },
            { header: "Descripción", key: "description", width: 40 },
            { header: "RP #", key: "rpNumber", width: 18 },
            { header: "Actividad (Código)", key: "activityCode", width: 18 },
            { header: "Actividad (Nombre)", key: "activityName", width: 35 },
            { header: "Posición Presupuestal", key: "rubricCode", width: 22 },
            { header: "Fuente Financiación", key: "fundingSourceName", width: 25 },
            { header: "Proyecto", key: "projectCode", width: 18 },
          ],
          data: positionsData,
        },
      ],
    };
  }
}
