import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MgaActivitiesService } from "../masters/mga-activities/services/mga-activities.service";
import { CdpPositionsService } from "../financial/cdps/services/cdp-positions.service";
import { DetailedActivitiesService } from "../masters/detailed-activities/services/detailed-activities.service";
import { ProductsService } from "../masters/products/services/products.service";
import { ProjectsService } from "../financial/projects/services/projects.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MgaDetailedRelation } from "../masters/mga-activities/entities/mga-detailed-relation.entity";

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
    this.logger.log("Preparando datos de exportación: CDP Positions");

    const search = filters?.search;

    // Traer TODOS los registros sin paginación
    const result = await this.cdpPositionsService.findForTable(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "cdp.number",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
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

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `posiciones-cdp-${now}.xlsx`,
      sheets: [
        {
          name: "Posiciones CDP",
          columns: [
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Posición #", key: "positionNumber", width: 15 },
            { header: "Rubro", key: "rubricCode", width: 20 },
            { header: "Proyecto", key: "projectCode", width: 18 },
            { header: "Necesidad", key: "needCode", width: 18 },
            { header: "Valor Posición", key: "positionValue", width: 20, numFmt: "#,##0.00" },
            { header: "Valor CDP", key: "cdpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Fuente (Nombre)", key: "fundingSourceName", width: 30 },
            { header: "Fuente (Código)", key: "fundingSourceCode", width: 18 },
            { header: "Observaciones", key: "observations", width: 35 },
          ],
          data,
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
            { header: "Rubro (Código)", key: "rubricCode", width: 18 },
            { header: "Rubro (Nombre)", key: "rubricName", width: 35 },
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
