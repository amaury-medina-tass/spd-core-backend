/**
 * Shared export column definitions used by multiple export builders.
 * Reduces code duplication when the same columns appear across export sheets.
 */

import { ExportColumn } from "../../internal/exports/export.types";

/* ------------------------------------------------------------------ */
/*  Shared Column Definitions                                          */
/* ------------------------------------------------------------------ */

export const PROJECT_COLUMNS: ExportColumn[] = [
    { header: "Código", key: "code", width: 18 },
    { header: "Nombre", key: "name", width: 40 },
    { header: "Presupuesto Inicial", key: "initialBudget", width: 20, numFmt: "#,##0.00" },
    { header: "Presupuesto Actual", key: "currentBudget", width: 20, numFmt: "#,##0.00" },
    { header: "Ejecución", key: "execution", width: 20, numFmt: "#,##0.00" },
    { header: "Origen", key: "origin", width: 20 },
    { header: "Estado", key: "state", width: 15 },
    { header: "Dependencia (Código)", key: "dependencyCode", width: 18 },
    { header: "Dependencia (Nombre)", key: "dependencyName", width: 35 },
];

export const MGA_ACTIVITIES_COLUMNS: ExportColumn[] = [
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
];

/** MGA columns used in projects-export (without product columns). */
export const MGA_SHORT_COLUMNS: ExportColumn[] = [
    { header: "Proyecto (Código)", key: "projectCode", width: 18 },
    { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
    { header: "MGA (Código)", key: "mgaCode", width: 18 },
    { header: "MGA (Nombre)", key: "mgaName", width: 40 },
    { header: "Observaciones", key: "observations", width: 35 },
    { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
    { header: "Saldo", key: "balance", width: 20, numFmt: "#,##0.00" },
    { header: "Act. Detalladas", key: "detailedActivitiesCount", width: 18 },
];

export const POAI_PPA_COLUMNS: ExportColumn[] = [
    { header: "Código Proyecto", key: "projectCode", width: 18 },
    { header: "Nombre Proyecto", key: "projectName", width: 40 },
    { header: "Año", key: "year", width: 10 },
    { header: "POAI Proyectado", key: "projectedPoai", width: 20, numFmt: "#,##0.00" },
    { header: "POAI Asignado", key: "assignedPoai", width: 20, numFmt: "#,##0.00" },
];

/** POAI/PPA columns when shown as a sub-sheet in projects-export. */
export const POAI_PPA_INLINE_COLUMNS: ExportColumn[] = [
    { header: "Proyecto (Código)", key: "projectCode", width: 18 },
    { header: "Proyecto (Nombre)", key: "projectName", width: 35 },
    { header: "Año", key: "year", width: 10 },
    { header: "POAI Proyectado", key: "projectedPoai", width: 20, numFmt: "#,##0.00" },
    { header: "POAI Asignado", key: "assignedPoai", width: 20, numFmt: "#,##0.00" },
];

export const DETAILED_ACTIVITY_COLUMNS: ExportColumn[] = [
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
];

export const INDICATOR_GOALS_COLUMNS: ExportColumn[] = [
    { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
    { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
    { header: "Año", key: "year", width: 10 },
    { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
];

export const INDICATOR_QUADRENNIUMS_COLUMNS: ExportColumn[] = [
    { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
    { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
    { header: "Año Inicio", key: "startYear", width: 12 },
    { header: "Año Fin", key: "endYear", width: 12 },
    { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
];

export const VARIABLE_GOALS_COLUMNS: ExportColumn[] = [
    { header: "Variable (Código)", key: "variableCode", width: 18 },
    { header: "Variable (Nombre)", key: "variableName", width: 40 },
    { header: "Año", key: "year", width: 10 },
    { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
];

export const VARIABLE_QUADRENNIUMS_COLUMNS: ExportColumn[] = [
    { header: "Variable (Código)", key: "variableCode", width: 18 },
    { header: "Variable (Nombre)", key: "variableName", width: 40 },
    { header: "Año Inicio", key: "startYear", width: 12 },
    { header: "Año Fin", key: "endYear", width: 12 },
    { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
];

export const VARIABLE_RELATION_COLUMNS: ExportColumn[] = [
    { header: "Variable (Código)", key: "variableCode", width: 18 },
    { header: "Variable (Nombre)", key: "variableName", width: 40 },
    { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
    { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
];

/* ------------------------------------------------------------------ */
/*  Shared Row Mappers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Maps a project row to the standard export format.
 */
export function mapProjectToExport(row: any) {
    return {
        code: row.code ?? "",
        name: row.name ?? "",
        initialBudget: row.initialBudget ? Number(row.initialBudget) : 0,
        currentBudget: row.currentBudget ? Number(row.currentBudget) : 0,
        execution: row.execution ? Number(row.execution) : 0,
        origin: row.origin ?? "",
        state: row.state ?? "",
        dependencyCode: row.dependency?.code ?? "",
        dependencyName: row.dependency?.name ?? "",
    };
}

/**
 * Maps an MGA activity row to the standard export format (full, with product).
 */
export function mapMgaActivityToExport(row: any) {
    return {
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
    };
}

/**
 * Maps an MGA activity row to the short export format (without product, for projects-export).
 */
export function mapMgaActivityShortToExport(row: any) {
    return {
        projectCode: row.project?.code ?? "",
        projectName: row.project?.name ?? "",
        mgaCode: row.code ?? "",
        mgaName: row.name ?? "",
        observations: row.observations ?? "",
        value: row.value ?? 0,
        balance: row.balance ?? 0,
        detailedActivitiesCount: row.detailedActivitiesCount ?? 0,
    };
}

/**
 * Maps a detailed activity row to export format.
 */
export function mapDetailedActivityToExport(row: any) {
    return {
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
    };
}

/**
 * Maps a POAI/PPA row to export format.
 */
export function mapPoaiPpaToExport(row: any) {
    return {
        projectCode: row.projectCode ?? row.project?.code ?? "",
        projectName: row.project?.name ?? "",
        year: row.year ?? "",
        projectedPoai: row.projectedPoai ? Number(row.projectedPoai) : 0,
        assignedPoai: row.assignedPoai ? Number(row.assignedPoai) : 0,
    };
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
export function getExportDate(): string {
    return new Date().toISOString().slice(0, 10);
}
