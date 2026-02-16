import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PreviousStudiesService } from "../../financial/previous-studies/services/previous-studies.service";
import { Need } from "../../financial/needs/entities/need.entity";
import { MasterContract } from "../../financial/master-contracts/entities/master-contract.entity";
import { ExportResult } from "./export.types";

@Injectable()
export class PreviousStudiesExportBuilder {
  private readonly logger = new Logger(PreviousStudiesExportBuilder.name);

  constructor(
    private readonly previousStudiesService: PreviousStudiesService,
    @InjectRepository(Need)
    private readonly needRepository: Repository<Need>,
    @InjectRepository(MasterContract)
    private readonly masterContractRepository: Repository<MasterContract>,
  ) {}

  async buildPreviousStudiesExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Estudios Previos");

    const search = filters?.search;

    // 1. Estudios Previos (tabla principal)
    const result = await this.previousStudiesService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
      code: row.code ?? "",
      status: row.status ?? "",
    }));

    // 2. Necesidades asociadas a Estudios Previos
    const needs = await this.needRepository
      .createQueryBuilder("n")
      .leftJoin("n.previousStudy", "ps")
      .select([
        "n.id",
        "n.code",
        "n.description",
        "n.amount",
        "ps.code",
        "ps.status",
      ])
      .orderBy("ps.code", "ASC")
      .addOrderBy("n.code", "ASC")
      .getMany();

    const needsData = needs.map((row: any) => ({
      previousStudyCode: row.previousStudy?.code ?? "",
      previousStudyStatus: row.previousStudy?.status ?? "",
      needCode: row.code ?? "",
      needDescription: row.description ?? "",
      needAmount: row.amount ? Number(row.amount) : 0,
    }));

    // 3. Contratos Marco asociados (a través de Need → PreviousStudy)
    const contracts = await this.masterContractRepository
      .createQueryBuilder("mc")
      .leftJoin("mc.need", "need")
      .leftJoin("need.previousStudy", "ps")
      .leftJoin("mc.contractor", "contractor")
      .select([
        "mc.id",
        "mc.number",
        "mc.object",
        "mc.totalValue",
        "mc.state",
        "need.code",
        "ps.code",
        "contractor.name",
        "contractor.nit",
      ])
      .orderBy("ps.code", "ASC")
      .addOrderBy("mc.number", "ASC")
      .getMany();

    const contractsData = contracts.map((row: any) => ({
      previousStudyCode: row.need?.previousStudy?.code ?? "",
      needCode: row.need?.code ?? "",
      contractNumber: row.number ?? "",
      contractObject: row.object ?? "",
      contractTotalValue: row.totalValue ? Number(row.totalValue) : 0,
      contractState: row.state ?? "",
      contractorName: row.contractor?.name ?? "",
      contractorNit: row.contractor?.nit ?? "",
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `estudios-previos-${now}.xlsx`,
      sheets: [
        {
          name: "Estudios Previos",
          columns: [
            { header: "Código", key: "code", width: 25 },
            { header: "Estado", key: "status", width: 20 },
          ],
          data,
        },
        {
          name: "Necesidades Asociadas",
          columns: [
            { header: "Estudio Previo (Código)", key: "previousStudyCode", width: 22 },
            { header: "Estudio Previo (Estado)", key: "previousStudyStatus", width: 20 },
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
            { header: "Necesidad (Descripción)", key: "needDescription", width: 45 },
            { header: "Monto", key: "needAmount", width: 20, numFmt: "#,##0.00" },
          ],
          data: needsData,
        },
        {
          name: "Contratos Marco",
          columns: [
            { header: "Estudio Previo (Código)", key: "previousStudyCode", width: 22 },
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "Objeto", key: "contractObject", width: 45 },
            { header: "Valor Total", key: "contractTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Estado", key: "contractState", width: 15 },
            { header: "Contratista", key: "contractorName", width: 35 },
            { header: "NIT", key: "contractorNit", width: 18 },
          ],
          data: contractsData,
        },
      ],
    };
  }
}
