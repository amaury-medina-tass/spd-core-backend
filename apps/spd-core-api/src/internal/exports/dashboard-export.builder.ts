import { Injectable, Logger } from "@nestjs/common";
import { DashboardService } from "../../financial/dashboard/services/dashboard.service";
import { ExportResult } from "./export.types";
import { getExportDate } from "../../shared/helpers/export-columns.helper";

@Injectable()
export class DashboardExportBuilder {
  private readonly logger = new Logger(DashboardExportBuilder.name);

  constructor(private readonly dashboardService: DashboardService) {}

  async buildFinancialDashboardExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Dashboard Financiero");

    // 1. Datos globales
    const globalData = await this.dashboardService.getGlobalData();

    const resumenData = [
      {
        metric: "Presupuesto Inicial Total",
        value: globalData.totalInitialBudget ? Number(globalData.totalInitialBudget) : 0,
      },
      {
        metric: "Presupuesto Actual Total",
        value: globalData.totalCurrentBudget ? Number(globalData.totalCurrentBudget) : 0,
      },
      {
        metric: "Ejecución Total",
        value: globalData.totalExecution ? Number(globalData.totalExecution) : 0,
      },
      {
        metric: "Total Proyectos",
        value: globalData.totalProjects ?? 0,
      },
      {
        metric: "Total Adiciones",
        value: globalData.totalAdditions ? Number(globalData.totalAdditions) : 0,
      },
      {
        metric: "Total Reducciones",
        value: globalData.totalReductions ? Number(globalData.totalReductions) : 0,
      },
      {
        metric: "Total Traslados",
        value: globalData.totalTransfers ? Number(globalData.totalTransfers) : 0,
      },
      {
        metric: "Total Necesidades",
        value: globalData.totalNeeds ?? 0,
      },
      {
        metric: "Total CDPs",
        value: globalData.totalCdps ?? 0,
      },
      {
        metric: "Total Contratos",
        value: globalData.totalContracts ?? 0,
      },
    ];

    // 2. Panorama presupuestal por proyecto
    const budgetOverview = await this.dashboardService.getProjectBudgetOverview();

    const budgetData = (budgetOverview as any[]).map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      initialBudget: row.initialBudget ? Number(row.initialBudget) : 0,
      currentBudget: row.currentBudget ? Number(row.currentBudget) : 0,
      execution: row.execution ? Number(row.execution) : 0,
      available: row.available ? Number(row.available) : 0,
      executionPercentage: row.executionPercentage ? Number(row.executionPercentage) : 0,
      dependencyName: row.dependencyName ?? "",
    }));

    // 3. Panorama de ejecución por proyecto
    const executionResult = await this.dashboardService.getProjectExecutionOverview(
      1,
      Number.MAX_SAFE_INTEGER,
    );

    const executionData = executionResult.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      initialBudget: row.initialBudget ? Number(row.initialBudget) : 0,
      currentBudget: row.currentBudget ? Number(row.currentBudget) : 0,
      execution: row.execution ? Number(row.execution) : 0,
      executionPercentage: row.executionPercentage ? Number(row.executionPercentage) : 0,
      dependencyName: row.dependencyName ?? "",
      mgaActivitiesCount: row.mgaActivitiesCount ?? 0,
    }));

    const now = getExportDate();

    return {
      fileName: `dashboard-financiero-${now}.xlsx`,
      sheets: [
        {
          name: "Resumen Global",
          columns: [
            { header: "Métrica", key: "metric", width: 30 },
            { header: "Valor", key: "value", width: 25, numFmt: "#,##0.00" },
          ],
          data: resumenData,
        },
        {
          name: "Panorama Presupuestal",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Presupuesto Inicial", key: "initialBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Presupuesto Actual", key: "currentBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Ejecución", key: "execution", width: 20, numFmt: "#,##0.00" },
            { header: "Disponible", key: "available", width: 20, numFmt: "#,##0.00" },
            { header: "% Ejecución", key: "executionPercentage", width: 15, numFmt: "#,##0.00" },
            { header: "Dependencia", key: "dependencyName", width: 35 },
          ],
          data: budgetData,
        },
        {
          name: "Ejecución por Proyecto",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Presupuesto Inicial", key: "initialBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Presupuesto Actual", key: "currentBudget", width: 20, numFmt: "#,##0.00" },
            { header: "Ejecución", key: "execution", width: 20, numFmt: "#,##0.00" },
            { header: "% Ejecución", key: "executionPercentage", width: 15, numFmt: "#,##0.00" },
            { header: "Dependencia", key: "dependencyName", width: 35 },
            { header: "Actividades MGA", key: "mgaActivitiesCount", width: 18 },
          ],
          data: executionData,
        },
      ],
    };
  }
}
