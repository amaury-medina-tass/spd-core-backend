import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CdpPositionsService } from "../../financial/cdps/services/cdp-positions.service";
import { Cdp } from "../../financial/cdps/entities/cdp.entity";
import { CdpPositionFunding } from "../../financial/cdps/entities/cdp-position-funding.entity";
import { ContractCdpRelation } from "../../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { CdpProject } from "../../financial/cdps/entities/cdp-project.entity";
import { ExportResult } from "./export.types";

@Injectable()
export class CdpExportBuilder {
  private readonly logger = new Logger(CdpExportBuilder.name);

  constructor(
    private readonly cdpPositionsService: CdpPositionsService,
    @InjectRepository(Cdp)
    private readonly cdpRepository: Repository<Cdp>,
    @InjectRepository(CdpPositionFunding)
    private readonly cdpPositionFundingRepository: Repository<CdpPositionFunding>,
    @InjectRepository(ContractCdpRelation)
    private readonly contractCdpRelationRepository: Repository<ContractCdpRelation>,
    @InjectRepository(CdpProject)
    private readonly cdpProjectRepository: Repository<CdpProject>,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  CDP Positions Export                                               */
  /* ------------------------------------------------------------------ */

  async buildCdpExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: CDP Completo");

    const search = filters?.search;

    // 1. Posiciones CDP (tabla principal enriquecida)
    const result = await this.cdpPositionsService.findForTable(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "cdp.number",
      "ASC",
    );

    const positionsData = result.data.map((row: any) => ({
      cdpNumber: row.cdpNumber ?? "",
      positionNumber: row.positionNumber ?? "",
      rubricCode: row.rubricCode ?? "",
      projectCode: row.projectCode ?? "",
      needCode: row.needCode ?? "",
      positionValue: row.positionValue ?? 0,
      cdpTotalValue: row.cdpTotalValue ?? 0,
      fundingSourceName: row.fundingSourceName ?? "",
      fundingSourceCode: row.fundingSourceCode ?? "",
      observations: row.observations ?? "",
    }));

    // 2. CDPs (cabeceras)
    const cdps = await this.cdpRepository
      .createQueryBuilder("cdp")
      .select([
        "cdp.id",
        "cdp.number",
        "cdp.totalValue",
        "cdp.balance",
        "cdp.dateIssue",
      ])
      .orderBy("cdp.number", "ASC")
      .getMany();

    const cdpData = cdps.map((cdp: any) => ({
      number: cdp.number ?? "",
      totalValue: cdp.totalValue ? Number(cdp.totalValue) : 0,
      balance: cdp.balance ? Number(cdp.balance) : 0,
      dateIssue: cdp.dateIssue ? new Date(cdp.dateIssue).toISOString().slice(0, 10) : "",
    }));

    // 3. Proyectos asociados a CDPs
    const cdpProjects = await this.cdpProjectRepository
      .createQueryBuilder("cp")
      .leftJoin("cp.cdp", "cdp")
      .leftJoin("cp.project", "project")
      .select([
        "cp.id",
        "cdp.number",
        "project.code",
        "project.name",
        "cp.allocatedValue",
      ])
      .orderBy("cdp.number", "ASC")
      .addOrderBy("project.code", "ASC")
      .getMany();

    const cdpProjectsData = cdpProjects.map((row: any) => ({
      cdpNumber: row.cdp?.number ?? "",
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      allocatedValue: row.allocatedValue ? Number(row.allocatedValue) : 0,
    }));

    // 4. Contratos marco vinculados a CDPs
    const contractRelations = await this.contractCdpRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.cdp", "cdp")
      .leftJoin("rel.masterContract", "mc")
      .leftJoin("mc.need", "need")
      .select([
        "rel.id",
        "cdp.number",
        "mc.number",
        "mc.object",
        "mc.totalValue",
        "mc.state",
        "need.code",
        "need.description",
      ])
      .orderBy("cdp.number", "ASC")
      .addOrderBy("mc.number", "ASC")
      .getMany();

    const contractData = contractRelations.map((row: any) => ({
      cdpNumber: row.cdp?.number ?? "",
      contractNumber: row.masterContract?.number ?? "",
      contractObject: row.masterContract?.object ?? "",
      contractTotalValue: row.masterContract?.totalValue ? Number(row.masterContract.totalValue) : 0,
      contractState: row.masterContract?.state ?? "",
      needCode: row.need?.code ?? "",
      needDescription: row.need?.description ?? "",
    }));

    // 5. Actividades detalladas asociadas a posiciones CDP
    const fundings = await this.cdpPositionFundingRepository
      .createQueryBuilder("cpf")
      .leftJoin("cpf.cdpPosition", "pos")
      .leftJoin("pos.cdp", "cdp")
      .leftJoin("cpf.detailedActivity", "da")
      .leftJoin("da.project", "project")
      .leftJoin("da.rubric", "rubric")
      .select([
        "cpf.id",
        "cdp.number",
        "pos.positionNumber",
        "da.code",
        "da.name",
        "project.code",
        "rubric.code",
        "cpf.assignedValue",
        "cpf.balance",
      ])
      .orderBy("cdp.number", "ASC")
      .addOrderBy("pos.positionNumber", "ASC")
      .addOrderBy("da.code", "ASC")
      .getMany();

    const activitiesData = fundings.map((row: any) => ({
      cdpNumber: row.cdpPosition?.cdp?.number ?? "",
      positionNumber: row.cdpPosition?.positionNumber ?? "",
      activityCode: row.detailedActivity?.code ?? "",
      activityName: row.detailedActivity?.name ?? "",
      projectCode: row.detailedActivity?.project?.code ?? "",
      rubricCode: row.detailedActivity?.rubric?.code ?? "",
      assignedValue: row.assignedValue ? Number(row.assignedValue) : 0,
      balance: row.balance ? Number(row.balance) : 0,
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `reporte-cdp-completo-${now}.xlsx`,
      sheets: [
        {
          name: "Posiciones CDP",
          columns: [
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Posición #", key: "positionNumber", width: 15 },
            { header: "Posición Presupuestal", key: "rubricCode", width: 25 },
            { header: "Proyecto", key: "projectCode", width: 18 },
            { header: "Necesidad", key: "needCode", width: 18 },
            { header: "Valor Posición", key: "positionValue", width: 20, numFmt: "#,##0.00" },
            { header: "Valor CDP", key: "cdpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Fuente (Nombre)", key: "fundingSourceName", width: 30 },
            { header: "Fuente (Código)", key: "fundingSourceCode", width: 18 },
            { header: "Observaciones", key: "observations", width: 35 },
          ],
          data: positionsData,
        },
        {
          name: "CDPs",
          columns: [
            { header: "Número CDP", key: "number", width: 18 },
            { header: "Valor Total", key: "totalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Expedición", key: "dateIssue", width: 18 },
          ],
          data: cdpData,
        },
        {
          name: "Proyectos CDP",
          columns: [
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 40 },
            { header: "Valor Asignado", key: "allocatedValue", width: 20, numFmt: "#,##0.00" },
          ],
          data: cdpProjectsData,
        },
        {
          name: "Contratos Marco",
          columns: [
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Contrato #", key: "contractNumber", width: 18 },
            { header: "Objeto", key: "contractObject", width: 45 },
            { header: "Valor Total", key: "contractTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Estado", key: "contractState", width: 15 },
            { header: "Necesidad (Código)", key: "needCode", width: 18 },
            { header: "Necesidad (Desc.)", key: "needDescription", width: 40 },
          ],
          data: contractData,
        },
        {
          name: "Actividades Detalladas",
          columns: [
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Posición #", key: "positionNumber", width: 15 },
            { header: "Actividad (Código)", key: "activityCode", width: 18 },
            { header: "Actividad (Nombre)", key: "activityName", width: 40 },
            { header: "Proyecto", key: "projectCode", width: 18 },
            { header: "Posición Presupuestal", key: "rubricCode", width: 25 },
            { header: "Valor Asignado", key: "assignedValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
          ],
          data: activitiesData,
        },
      ],
    };
  }
}
