import { Injectable, Logger } from "@nestjs/common";
import { PoaiPpaService } from "../../financial/poai-ppa/services/poai-ppa.service";
import { ProjectsService } from "../../financial/projects/services/projects.service";
import { ExportResult } from "./export.types";
import {
  POAI_PPA_COLUMNS,
  PROJECT_COLUMNS,
  mapProjectToExport,
  mapPoaiPpaToExport,
  getExportDate,
} from "../../shared/helpers/export-columns.helper";

@Injectable()
export class PoaiPpaExportBuilder {
  private readonly logger = new Logger(PoaiPpaExportBuilder.name);

  constructor(
    private readonly poaiPpaService: PoaiPpaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async buildPoaiPpaExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: POAI/PPA");

    const search = filters?.search;

    // 1. POAI/PPA (tabla principal)
    const result = await this.poaiPpaService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "projectCode",
      "ASC",
    );

    const data = result.data.map(mapPoaiPpaToExport);

    // 2. Proyectos (detalle completo)
    const projectsResult = await this.projectsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      undefined,
      "code",
      "ASC",
    );

    const projectsData = projectsResult.data.map(mapProjectToExport);

    const now = getExportDate();

    return {
      fileName: `poai-ppa-${now}.xlsx`,
      sheets: [
        {
          name: "POAI PPA",
          columns: POAI_PPA_COLUMNS,
          data,
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
