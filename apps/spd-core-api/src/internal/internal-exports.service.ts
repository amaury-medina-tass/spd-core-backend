import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  ActivitiesExportBuilder,
  CdpExportBuilder,
  NeedsExportBuilder,
  ContractsExportBuilder,
  ProjectsExportBuilder,
  PreviousStudiesExportBuilder,
  PoaiPpaExportBuilder,
  DashboardExportBuilder,
  IndicatorsExportBuilder,
  ExportResult,
} from "./exports";

/**
 * Servicio orquestador de exportaciones internas.
 *
 * El micro de Files llama GET /internal/exports/:type
 * y este servicio delega a los builders especializados
 * para obtener la estructura de hojas con columnas y datos
 * listos para generar un archivo.
 *
 * La lógica de dominio (qué columnas, qué joins) vive en cada builder.
 * Files solo renderiza.
 */
@Injectable()
export class InternalExportsService {
  private readonly logger = new Logger(InternalExportsService.name);

  constructor(
    private readonly activitiesBuilder: ActivitiesExportBuilder,
    private readonly cdpBuilder: CdpExportBuilder,
    private readonly needsBuilder: NeedsExportBuilder,
    private readonly contractsBuilder: ContractsExportBuilder,
    private readonly projectsBuilder: ProjectsExportBuilder,
    private readonly previousStudiesBuilder: PreviousStudiesExportBuilder,
    private readonly poaiPpaBuilder: PoaiPpaExportBuilder,
    private readonly dashboardBuilder: DashboardExportBuilder,
    private readonly indicatorsBuilder: IndicatorsExportBuilder,
  ) {}

  /**
   * Resuelve el tipo de exportación y devuelve el payload listo para Files.
   */
  async getExportData(
    type: string,
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    switch (type) {
      case "mga-activities":
        return this.activitiesBuilder.buildMgaActivitiesExport(filters);
      case "cdp":
        return this.cdpBuilder.buildCdpExport(filters);
      case "activities":
        return this.activitiesBuilder.buildActivitiesExport(filters);
      case "needs":
        return this.needsBuilder.buildNeedsExport(filters);
      case "contracts":
        return this.contractsBuilder.buildContractsExport(filters);
      case "projects":
        return this.projectsBuilder.buildProjectsExport(filters);
      case "previous-studies":
        return this.previousStudiesBuilder.buildPreviousStudiesExport(filters);
      case "poai-ppa":
        return this.poaiPpaBuilder.buildPoaiPpaExport(filters);
      case "indicators":
        return this.indicatorsBuilder.buildIndicatorsExport(filters);
      case "variables":
        return this.indicatorsBuilder.buildVariablesExport(filters);
      case "financial-dashboard":
        return this.dashboardBuilder.buildFinancialDashboardExport(filters);
      default:
        throw new NotFoundException(
          `Tipo de exportación "${type}" no soportado`,
        );
    }
  }
}

/** Re-export de tipos para compatibilidad */
export type { ExportSheet, ExportColumn, ExportResult } from "./exports";
