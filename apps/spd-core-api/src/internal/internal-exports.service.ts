import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MgaActivitiesService } from "../masters/mga-activities/services/mga-activities.service";
import { CdpPositionsService } from "../financial/cdps/services/cdp-positions.service";
import { DetailedActivitiesService } from "../masters/detailed-activities/services/detailed-activities.service";
import { ProductsService } from "../masters/products/services/products.service";
import { ProjectsService } from "../financial/projects/services/projects.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MgaDetailedRelation } from "../masters/mga-activities/entities/mga-detailed-relation.entity";
import { Cdp } from "../financial/cdps/entities/cdp.entity";
import { CdpPositionFunding } from "../financial/cdps/entities/cdp-position-funding.entity";
import { ContractCdpRelation } from "../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { CdpProject } from "../financial/cdps/entities/cdp-project.entity";

/**
 * Servicio interno que prepara datos de exportación.
 *
 * El micro de Files llama GET /internal/exports/:type
 * y este servicio devuelve la estructura de hojas (sheets)
 * con columnas y datos listos para generar un archivo.
 *
 * La lógica de dominio (qué columnas, qué joins) vive AQUÍ en el core.
 * Files solo renderiza.
 */
@Injectable()
export class InternalExportsService {
  private readonly logger = new Logger(InternalExportsService.name);

  constructor(
    private readonly mgaService: MgaActivitiesService,
    private readonly cdpPositionsService: CdpPositionsService,
    private readonly detailedActivitiesService: DetailedActivitiesService,
    private readonly productsService: ProductsService,
    private readonly projectsService: ProjectsService,
    @InjectRepository(MgaDetailedRelation)
    private readonly mgaDetailedRelationRepository: Repository<MgaDetailedRelation>,
    @InjectRepository(Cdp)
    private readonly cdpRepository: Repository<Cdp>,
    @InjectRepository(CdpPositionFunding)
    private readonly cdpPositionFundingRepository: Repository<CdpPositionFunding>,
    @InjectRepository(ContractCdpRelation)
    private readonly contractCdpRelationRepository: Repository<ContractCdpRelation>,
    @InjectRepository(CdpProject)
    private readonly cdpProjectRepository: Repository<CdpProject>,
  ) {}

  /**
   * Resuelve el tipo de exportación y devuelve el payload listo para Files.
   */
  async getExportData(
    type: string,
    filters?: Record<string, any>,
  ): Promise<{ fileName: string; sheets: ExportSheet[] }> {
    switch (type) {
      case "mga-activities":
        return this.buildMgaActivitiesExport(filters);
      case "cdp":
        return this.buildCdpExport(filters);
      case "activities":
        return this.buildActivitiesExport(filters);
      default:
        throw new NotFoundException(
          `Tipo de exportación "${type}" no soportado`,
        );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  MGA Activities Export                                              */
  /* ------------------------------------------------------------------ */

  private async buildMgaActivitiesExport(
    filters?: Record<string, any>,
  ): Promise<{ fileName: string; sheets: ExportSheet[] }> {
    this.logger.log("Preparando datos de exportación: MGA Activities");

    const search = filters?.search;

    // Traer TODOS los registros sin paginación
    const result = await this.mgaService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      observations: row.observations ?? "",
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      productCode: row.product?.productCode ?? "",
      productName: row.product?.productName ?? "",
      value: row.value ?? 0,
      balance: row.balance ?? 0,
      detailedActivitiesCount: row.detailedActivitiesCount ?? 0,
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `actividades-mga-${now}.xlsx`,
      sheets: [
        {
          name: "Actividades MGA",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "Producto (Código)", key: "productCode", width: 18 },
            { header: "Producto (Nombre)", key: "productName", width: 35 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "Act. Detalladas", key: "detailedActivitiesCount", width: 18 },
          ],
          data,
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  /*  CDP Positions Export                                               */
  /* ------------------------------------------------------------------ */

  private async buildCdpExport(
    filters?: Record<string, any>,
  ): Promise<{ fileName: string; sheets: ExportSheet[] }> {
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
        // Sheet 1: Posiciones CDP (tabla principal)
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
        // Sheet 2: CDPs (cabeceras)
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
        // Sheet 3: Proyectos por CDP
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
        // Sheet 4: Contratos Marco
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
        // Sheet 5: Actividades Detalladas por Posición
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

  /* ------------------------------------------------------------------ */
  /*  Complete Activities Export (MGA + Detailed + Products + Projects) */
  /* ------------------------------------------------------------------ */

  private async buildActivitiesExport(
    filters?: Record<string, any>,
  ): Promise<{ fileName: string; sheets: ExportSheet[] }> {
    this.logger.log("Preparando datos de exportación: Complete Activities Report");

    const search = filters?.search;

    // 1. Actividades MGA
    const mgaResult = await this.mgaService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const mgaData = mgaResult.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      observations: row.observations ?? "",
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      productCode: row.product?.productCode ?? "",
      productName: row.product?.productName ?? "",
      value: row.value ?? 0,
      balance: row.balance ?? 0,
      detailedActivitiesCount: row.detailedActivitiesCount ?? 0,
    }));

    // 2. Actividades Detalladas
    const detailedResult = await this.detailedActivitiesService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const detailedData = detailedResult.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      observations: row.observations ?? "",
      activityDate: row.activityDate ?? "",
      budgetCeiling: row.budgetCeiling ?? 0,
      balance: row.balance ?? 0,
      cpc: row.cpc ?? "",
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      rubricCode: row.rubric?.code ?? "",
      rubricName: row.rubric?.accountName ?? "",
    }));

    // 3. Relaciones MGA -> Detalladas
    const relations = await this.mgaDetailedRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.mgaActivity", "mga")
      .leftJoin("rel.detailedActivity", "detailed")
      .select([
        "rel.id",
        "mga.id",
        "mga.code",
        "mga.name",
        "detailed.id",
        "detailed.code",
        "detailed.name",
      ])
      .orderBy("mga.code", "ASC")
      .addOrderBy("detailed.code", "ASC")
      .getMany();

    const relationsData = relations.map((row: any) => ({
      mgaCode: row.mgaActivity?.code ?? "",
      mgaName: row.mgaActivity?.name ?? "",
      detailedCode: row.detailedActivity?.code ?? "",
      detailedName: row.detailedActivity?.name ?? "",
    }));

    // 4. Productos
    const productsResult = await this.productsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "productCode",
      "ASC",
    );

    const productsData = productsResult.data.map((row: any) => ({
      productCode: row.productCode ?? "",
      productName: row.productName ?? "",
      indicatorCode: row.indicatorCode ?? "",
      indicatorName: row.indicatorName ?? "",
      measuredUnit: row.measuredUnit ?? "",
      unitType: row.unitType ?? "",
      isMainIndicator: row.isMainIndicator ? "Sí" : "No",
    }));

    // 5. Proyectos
    const projectsResult = await this.projectsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const projectsData = projectsResult.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      initialBudget: row.initialBudget ?? 0,
      currentBudget: row.currentBudget ?? 0,
      execution: row.execution ?? 0,
      origin: row.origin ?? "",
      state: row.state ?? "",
      dependencyCode: row.dependency?.code ?? "",
      dependencyName: row.dependency?.name ?? "",
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `reporte-actividades-completo-${now}.xlsx`,
      sheets: [
        // Sheet 1: Actividades MGA
        {
          name: "Actividades MGA",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "Producto (Código)", key: "productCode", width: 18 },
            { header: "Producto (Nombre)", key: "productName", width: 35 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "Act. Detalladas", key: "detailedActivitiesCount", width: 18 },
          ],
          data: mgaData,
        },
        // Sheet 2: Actividades Detalladas
        {
          name: "Actividades Detalladas",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "Fecha Actividad", key: "activityDate", width: 18 },
            { header: "Techo Presupuestal", key: "budgetCeiling", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "CPC", key: "cpc", width: 18 },
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "Posición Presupuestal (Código)", key: "rubricCode", width: 28 },
            { header: "Posición Presupuestal (Nombre)", key: "rubricName", width: 40 },
          ],
          data: detailedData,
        },
        // Sheet 3: Relaciones MGA-Detalladas
        {
          name: "Relaciones MGA-Detalladas",
          columns: [
            { header: "MGA (Código)", key: "mgaCode", width: 18 },
            { header: "MGA (Nombre)", key: "mgaName", width: 40 },
            { header: "Detallada (Código)", key: "detailedCode", width: 18 },
            { header: "Detallada (Nombre)", key: "detailedName", width: 40 },
          ],
          data: relationsData,
        },
        // Sheet 4: Productos
        {
          name: "Productos",
          columns: [
            { header: "Código Producto", key: "productCode", width: 18 },
            { header: "Nombre Producto", key: "productName", width: 40 },
            { header: "Código Indicador", key: "indicatorCode", width: 18 },
            { header: "Nombre Indicador", key: "indicatorName", width: 40 },
            { header: "Unidad Medida", key: "measuredUnit", width: 20 },
            { header: "Tipo Unidad", key: "unitType", width: 20 },
            { header: "Indicador Principal", key: "isMainIndicator", width: 18 },
          ],
          data: productsData,
        },
        // Sheet 5: Proyectos
        {
          name: "Proyectos",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Presupuesto Inicial", key: "initialBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Presupuesto Actual", key: "currentBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Ejecución", key: "execution", width: 20, numFmt: "#,##0.00" },
            { header: "Origen", key: "origin", width: 20 },
            { header: "Estado", key: "state", width: 15 },
            { header: "Dependencia (Código)", key: "dependencyCode", width: 18 },
            { header: "Dependencia (Nombre)", key: "dependencyName", width: 35 },
          ],
          data: projectsData,
        },
      ],
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Tipos exportados                                                   */
/* ------------------------------------------------------------------ */

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
}

export interface ExportColumn {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}
