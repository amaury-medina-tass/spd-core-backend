import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectsService } from "../../financial/projects/services/projects.service";
import { MgaActivitiesService } from "../../masters/mga-activities/services/mga-activities.service";
import { DetailedActivitiesService } from "../../masters/detailed-activities/services/detailed-activities.service";
import { CdpProject } from "../../financial/cdps/entities/cdp-project.entity";
import { PoaiPpa } from "../../financial/poai-ppa/entities/poai-ppa.entity";
import { ExportResult } from "./export.types";

@Injectable()
export class ProjectsExportBuilder {
  private readonly logger = new Logger(ProjectsExportBuilder.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly mgaService: MgaActivitiesService,
    private readonly detailedActivitiesService: DetailedActivitiesService,
    @InjectRepository(CdpProject)
    private readonly cdpProjectRepository: Repository<CdpProject>,
    @InjectRepository(PoaiPpa)
    private readonly poaiPpaRepository: Repository<PoaiPpa>,
  ) {}

  async buildProjectsExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Proyectos");

    const search = filters?.search;

    // 1. Proyectos (tabla principal)
    const result = await this.projectsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
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

    // 2. CDPs asociados a proyectos
    const cdpProjects = await this.cdpProjectRepository
      .createQueryBuilder("cp")
      .leftJoin("cp.cdp", "cdp")
      .leftJoin("cp.project", "project")
      .select([
        "cp.id",
        "cp.allocatedValue",
        "project.code",
        "project.name",
        "cdp.number",
        "cdp.totalValue",
        "cdp.balance",
        "cdp.dateIssue",
      ])
      .orderBy("project.code", "ASC")
      .addOrderBy("cdp.number", "ASC")
      .getMany();

    const cdpData = cdpProjects.map((row: any) => ({
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      cdpNumber: row.cdp?.number ?? "",
      cdpTotalValue: row.cdp?.totalValue ? Number(row.cdp.totalValue) : 0,
      cdpBalance: row.cdp?.balance ? Number(row.cdp.balance) : 0,
      allocatedValue: row.allocatedValue ? Number(row.allocatedValue) : 0,
      cdpDateIssue: row.cdp?.dateIssue ? new Date(row.cdp.dateIssue).toISOString().slice(0, 10) : "",
    }));

    // 3. Actividades MGA por proyecto
    const mgaResult = await this.mgaService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      undefined,
      "code",
      "ASC",
    );

    const mgaData = mgaResult.data.map((row: any) => ({
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      mgaCode: row.code ?? "",
      mgaName: row.name ?? "",
      observations: row.observations ?? "",
      value: row.value ?? 0,
      balance: row.balance ?? 0,
      detailedActivitiesCount: row.detailedActivitiesCount ?? 0,
    }));

    // 4. Actividades Detalladas por proyecto
    const detailedResult = await this.detailedActivitiesService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      undefined,
      "code",
      "ASC",
    );

    const detailedData = detailedResult.data.map((row: any) => ({
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
      activityCode: row.code ?? "",
      activityName: row.name ?? "",
      budgetCeiling: row.budgetCeiling ? Number(row.budgetCeiling) : 0,
      balance: row.balance ? Number(row.balance) : 0,
      cpc: row.cpc ?? "",
      rubricCode: row.rubric?.code ?? "",
    }));

    // 5. POAI/PPA por proyecto
    const poaiPpa = await this.poaiPpaRepository
      .createQueryBuilder("pp")
      .leftJoin("pp.project", "project")
      .select([
        "pp.id",
        "pp.projectCode",
        "pp.year",
        "pp.projectedPoai",
        "pp.assignedPoai",
        "project.code",
        "project.name",
      ])
      .orderBy("project.code", "ASC")
      .addOrderBy("pp.year", "ASC")
      .getMany();

    const poaiData = poaiPpa.map((row: any) => ({
      projectCode: row.project?.code ?? row.projectCode ?? "",
      projectName: row.project?.name ?? "",
      year: row.year ?? "",
      projectedPoai: row.projectedPoai ? Number(row.projectedPoai) : 0,
      assignedPoai: row.assignedPoai ? Number(row.assignedPoai) : 0,
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `proyectos-${now}.xlsx`,
      sheets: [
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
          data,
        },
        {
          name: "CDPs Asociados",
          columns: [
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "CDP #", key: "cdpNumber", width: 15 },
            { header: "Valor CDP", key: "cdpTotalValue", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo CDP", key: "cdpBalance", width: 20, numFmt: "#,##0.00" },
            { header: "Valor Asignado", key: "allocatedValue", width: 20, numFmt: "#,##0.00" },
            { header: "Fecha Expedición", key: "cdpDateIssue", width: 18 },
          ],
          data: cdpData,
        },
        {
          name: "Actividades MGA",
          columns: [
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "MGA (Código)", key: "mgaCode", width: 18 },
            { header: "MGA (Nombre)", key: "mgaName", width: 40 },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "Act. Detalladas", key: "detailedActivitiesCount", width: 18 },
          ],
          data: mgaData,
        },
        {
          name: "Actividades Detalladas",
          columns: [
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "Actividad (Código)", key: "activityCode", width: 18 },
            { header: "Actividad (Nombre)", key: "activityName", width: 40 },
            { header: "Techo Presupuestal", key: "budgetCeiling", width: 20, numFmt: "#,##0.00" },
            { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
            { header: "CPC", key: "cpc", width: 18 },
            { header: "Posición Presupuestal", key: "rubricCode", width: 22 },
          ],
          data: detailedData,
        },
        {
          name: "POAI PPA",
          columns: [
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
            { header: "Año", key: "year", width: 10 },
            { header: "POAI Proyectado", key: "projectedPoai", width: 20, numFmt: "#,##0.00" },
            { header: "POAI Asignado", key: "assignedPoai", width: 20, numFmt: "#,##0.00" },
          ],
          data: poaiData,
        },
      ],
    };
  }
}
