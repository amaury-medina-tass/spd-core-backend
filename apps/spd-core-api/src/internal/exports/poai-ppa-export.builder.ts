import { Injectable, Logger } from "@nestjs/common";
import { PoaiPpaService } from "../../financial/poai-ppa/services/poai-ppa.service";
import { ProjectsService } from "../../financial/projects/services/projects.service";
import { ExportResult } from "./export.types";

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

    const data = result.data.map((row: any) => ({
      projectCode: row.projectCode ?? row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      year: row.year ?? "",
      projectedPoai: row.projectedPoai ? Number(row.projectedPoai) : 0,
      assignedPoai: row.assignedPoai ? Number(row.assignedPoai) : 0,
    }));

    // 2. Proyectos (detalle completo)
    const projectsResult = await this.projectsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      undefined,
      "code",
      "ASC",
    );

    const projectsData = projectsResult.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      initialBudget: row.initialBudget ? Number(row.initialBudget) : 0,
      currentBudget: row.currentBudget ? Number(row.currentBudget) : 0,
      execution: row.execution ? Number(row.execution) : 0,
      origin: row.origin ?? "",
      state: row.state ?? "",
      dependencyCode: row.dependency?.code ?? "",
      dependencyName: row.dependency?.name ?? "",
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `poai-ppa-${now}.xlsx`,
      sheets: [
        {
          name: "POAI PPA",
          columns: [
            { header: "Código Proyecto", key: "projectCode", width: 18 },
            { header: "Nombre Proyecto", key: "projectName", width: 40 },
            { header: "Año", key: "year", width: 10 },
            { header: "POAI Proyectado", key: "projectedPoai", width: 20, numFmt: "#,##0.00" },
            { header: "POAI Asignado", key: "assignedPoai", width: 20, numFmt: "#,##0.00" },
          ],
          data,
        },
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
