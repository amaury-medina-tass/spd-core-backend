import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MgaActivitiesService } from "../../masters/mga-activities/services/mga-activities.service";
import { DetailedActivitiesService } from "../../masters/detailed-activities/services/detailed-activities.service";
import { ProductsService } from "../../masters/products/services/products.service";
import { ProjectsService } from "../../financial/projects/services/projects.service";
import { MgaDetailedRelation } from "../../masters/mga-activities/entities/mga-detailed-relation.entity";
import { ExportResult } from "./export.types";
import {
  MGA_ACTIVITIES_COLUMNS,
  DETAILED_ACTIVITY_COLUMNS,
  PROJECT_COLUMNS,
  mapMgaActivityToExport,
  mapDetailedActivityToExport,
  mapProjectToExport,
  getExportDate,
} from "../../shared/helpers/export-columns.helper";

@Injectable()
export class ActivitiesExportBuilder {
  private readonly logger = new Logger(ActivitiesExportBuilder.name);

  constructor(
    private readonly mgaService: MgaActivitiesService,
    private readonly detailedActivitiesService: DetailedActivitiesService,
    private readonly productsService: ProductsService,
    private readonly projectsService: ProjectsService,
    @InjectRepository(MgaDetailedRelation)
    private readonly mgaDetailedRelationRepository: Repository<MgaDetailedRelation>,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  MGA Activities Export                                              */
  /* ------------------------------------------------------------------ */

  async buildMgaActivitiesExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: MGA Activities");

    const search = filters?.search;

    const result = await this.mgaService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map(mapMgaActivityToExport);

    const now = getExportDate();

    return {
      fileName: `actividades-mga-${now}.xlsx`,
      sheets: [
        {
          name: "Actividades MGA",
          columns: MGA_ACTIVITIES_COLUMNS,
          data,
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Complete Activities Export (MGA + Detailed + Products + Projects)  */
  /* ------------------------------------------------------------------ */

  async buildActivitiesExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
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

    const mgaData = mgaResult.data.map(mapMgaActivityToExport);

    // 2. Actividades Detalladas
    const detailedResult = await this.detailedActivitiesService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const detailedData = detailedResult.data.map(mapDetailedActivityToExport);

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

    const projectsData = projectsResult.data.map(mapProjectToExport);

    const now = getExportDate();

    return {
      fileName: `reporte-actividades-completo-${now}.xlsx`,
      sheets: [
        {
          name: "Actividades MGA",
          columns: MGA_ACTIVITIES_COLUMNS,
          data: mgaData,
        },
        {
          name: "Actividades Detalladas",
          columns: DETAILED_ACTIVITY_COLUMNS,
          data: detailedData,
        },
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
        {
          name: "Proyectos",
          columns: PROJECT_COLUMNS,
          data: projectsData,
        },
      ],
    };
  }
}
