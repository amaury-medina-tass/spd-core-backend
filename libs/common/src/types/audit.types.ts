/**
 * Audit Log Types and Constants — SPD Core
 * Estructura estandarizada para logs de auditoría en CosmosDB
 */

// ============================================================
// Acciones de Auditoría
// ============================================================
export enum AuditAction {
    // --- Proyectos ---
    PROJECT_CREATED = "PROJECT_CREATED",
    PROJECT_UPDATED = "PROJECT_UPDATED",
    PROJECT_DELETED = "PROJECT_DELETED",

    // --- Dependencias ---
    // (read-only desde SAP, sin CUD)

    // --- Fuentes de Financiación ---
    FUNDING_SOURCE_CREATED = "FUNDING_SOURCE_CREATED",
    FUNDING_SOURCE_UPDATED = "FUNDING_SOURCE_UPDATED",
    FUNDING_SOURCE_DELETED = "FUNDING_SOURCE_DELETED",

    // --- CDP ---
    CDP_POSITION_OBSERVATIONS_UPDATED = "CDP_POSITION_OBSERVATIONS_UPDATED",
    CDP_ACTIVITY_ASSOCIATED = "CDP_ACTIVITY_ASSOCIATED",
    CDP_ACTIVITY_DISASSOCIATED = "CDP_ACTIVITY_DISASSOCIATED",
    CDP_ACTIVITY_CONSUMED = "CDP_ACTIVITY_CONSUMED",

    // --- POAI PPA ---
    POAI_PPA_CREATED = "POAI_PPA_CREATED",
    POAI_PPA_UPDATED = "POAI_PPA_UPDATED",
    POAI_PPA_DELETED = "POAI_PPA_DELETED",

    // --- Actividades Detalladas ---
    DETAILED_ACTIVITY_CREATED = "DETAILED_ACTIVITY_CREATED",
    DETAILED_ACTIVITY_UPDATED = "DETAILED_ACTIVITY_UPDATED",
    DETAILED_ACTIVITY_DELETED = "DETAILED_ACTIVITY_DELETED",

    // --- Actividades MGA ---
    MGA_ACTIVITY_CREATED = "MGA_ACTIVITY_CREATED",
    MGA_ACTIVITY_UPDATED = "MGA_ACTIVITY_UPDATED",
    MGA_ACTIVITY_DELETED = "MGA_ACTIVITY_DELETED",
    MGA_DETAILED_RELATION_ADDED = "MGA_DETAILED_RELATION_ADDED",
    MGA_DETAILED_RELATION_REMOVED = "MGA_DETAILED_RELATION_REMOVED",

    // --- Variables ---
    VARIABLE_CREATED = "VARIABLE_CREATED",
    VARIABLE_UPDATED = "VARIABLE_UPDATED",
    VARIABLE_DELETED = "VARIABLE_DELETED",

    // --- Metas de Variables ---
    VARIABLE_GOAL_CREATED = "VARIABLE_GOAL_CREATED",
    VARIABLE_GOAL_UPDATED = "VARIABLE_GOAL_UPDATED",
    VARIABLE_GOAL_DELETED = "VARIABLE_GOAL_DELETED",

    // --- Cuatrienios de Variables ---
    VARIABLE_QUADRENNIUM_CREATED = "VARIABLE_QUADRENNIUM_CREATED",
    VARIABLE_QUADRENNIUM_UPDATED = "VARIABLE_QUADRENNIUM_UPDATED",
    VARIABLE_QUADRENNIUM_DELETED = "VARIABLE_QUADRENNIUM_DELETED",

    // --- Ubicaciones de Variables ---
    VARIABLE_LOCATION_ADDED = "VARIABLE_LOCATION_ADDED",
    VARIABLE_LOCATION_REMOVED = "VARIABLE_LOCATION_REMOVED",

    // --- Indicadores Plan Indicativo ---
    INDICATIVE_INDICATOR_CREATED = "INDICATIVE_INDICATOR_CREATED",
    INDICATIVE_INDICATOR_UPDATED = "INDICATIVE_INDICATOR_UPDATED",
    INDICATIVE_INDICATOR_DELETED = "INDICATIVE_INDICATOR_DELETED",

    // --- Metas de Indicadores Plan Indicativo ---
    INDICATIVE_INDICATOR_GOAL_CREATED = "INDICATIVE_INDICATOR_GOAL_CREATED",
    INDICATIVE_INDICATOR_GOAL_UPDATED = "INDICATIVE_INDICATOR_GOAL_UPDATED",
    INDICATIVE_INDICATOR_GOAL_DELETED = "INDICATIVE_INDICATOR_GOAL_DELETED",

    // --- Cuatrienios de Indicadores Plan Indicativo ---
    INDICATIVE_INDICATOR_QUADRENNIUM_CREATED = "INDICATIVE_INDICATOR_QUADRENNIUM_CREATED",
    INDICATIVE_INDICATOR_QUADRENNIUM_UPDATED = "INDICATIVE_INDICATOR_QUADRENNIUM_UPDATED",
    INDICATIVE_INDICATOR_QUADRENNIUM_DELETED = "INDICATIVE_INDICATOR_QUADRENNIUM_DELETED",

    // --- Indicadores Plan de Acción ---
    ACTION_INDICATOR_CREATED = "ACTION_INDICATOR_CREATED",
    ACTION_INDICATOR_UPDATED = "ACTION_INDICATOR_UPDATED",
    ACTION_INDICATOR_DELETED = "ACTION_INDICATOR_DELETED",

    // --- Metas de Indicadores Plan de Acción ---
    ACTION_INDICATOR_GOAL_CREATED = "ACTION_INDICATOR_GOAL_CREATED",
    ACTION_INDICATOR_GOAL_UPDATED = "ACTION_INDICATOR_GOAL_UPDATED",
    ACTION_INDICATOR_GOAL_DELETED = "ACTION_INDICATOR_GOAL_DELETED",

    // --- Cuatrienios de Indicadores Plan de Acción ---
    ACTION_INDICATOR_QUADRENNIUM_CREATED = "ACTION_INDICATOR_QUADRENNIUM_CREATED",
    ACTION_INDICATOR_QUADRENNIUM_UPDATED = "ACTION_INDICATOR_QUADRENNIUM_UPDATED",
    ACTION_INDICATOR_QUADRENNIUM_DELETED = "ACTION_INDICATOR_QUADRENNIUM_DELETED",

    // --- Relaciones Variable ↔ Indicador ---
    VARIABLE_INDICATIVE_RELATION_ASSOCIATED = "VARIABLE_INDICATIVE_RELATION_ASSOCIATED",
    VARIABLE_INDICATIVE_RELATION_DISASSOCIATED = "VARIABLE_INDICATIVE_RELATION_DISASSOCIATED",
    VARIABLE_ACTION_RELATION_ASSOCIATED = "VARIABLE_ACTION_RELATION_ASSOCIATED",
    VARIABLE_ACTION_RELATION_DISASSOCIATED = "VARIABLE_ACTION_RELATION_DISASSOCIATED",

    // --- Relaciones Proyecto ↔ Indicador de Acción ---
    PROJECT_ACTION_INDICATOR_ASSOCIATED = "PROJECT_ACTION_INDICATOR_ASSOCIATED",
    PROJECT_ACTION_INDICATOR_DISASSOCIATED = "PROJECT_ACTION_INDICATOR_DISASSOCIATED",

    // --- Ubicaciones de Indicadores ---
    INDICATOR_LOCATION_ADDED = "INDICATOR_LOCATION_ADDED",
    INDICATOR_LOCATION_REMOVED = "INDICATOR_LOCATION_REMOVED",

    // --- Fórmulas ---
    FORMULA_CREATED = "FORMULA_CREATED",
    FORMULA_UPDATED = "FORMULA_UPDATED",

    // --- Modificaciones Presupuestales ---
    BUDGET_MODIFICATION_CREATED = "BUDGET_MODIFICATION_CREATED",

    // --- Avances de Variables (SUB) ---
    VARIABLE_ADVANCE_CREATED = "VARIABLE_ADVANCE_CREATED",
    VARIABLE_ADVANCE_UPDATED = "VARIABLE_ADVANCE_UPDATED",

    // --- Avances de Indicadores (SUB) ---
    INDICATOR_ADVANCE_CREATED = "INDICATOR_ADVANCE_CREATED",
    INDICATOR_ADVANCE_UPDATED = "INDICATOR_ADVANCE_UPDATED",

    // --- Sincronización SAP ---
    SAP_SYNC_REQUESTED = "SAP_SYNC_REQUESTED",
    SAP_SYNC_COMPLETED = "SAP_SYNC_COMPLETED",
    SAP_SYNC_FAILED = "SAP_SYNC_FAILED",

    // --- Rubrics ---
    RUBRIC_CREATED = "RUBRIC_CREATED",
    RUBRIC_UPDATED = "RUBRIC_UPDATED",
    RUBRIC_DELETED = "RUBRIC_DELETED",

    // --- Products ---
    PRODUCT_CREATED = "PRODUCT_CREATED",
    PRODUCT_UPDATED = "PRODUCT_UPDATED",
    PRODUCT_DELETED = "PRODUCT_DELETED",

    // --- Contractors ---
    CONTRACTOR_CREATED = "CONTRACTOR_CREATED",
    CONTRACTOR_UPDATED = "CONTRACTOR_UPDATED",
    CONTRACTOR_DELETED = "CONTRACTOR_DELETED",

    // --- Master Contracts ---
    MASTER_CONTRACT_CREATED = "MASTER_CONTRACT_CREATED",
    MASTER_CONTRACT_UPDATED = "MASTER_CONTRACT_UPDATED",
    MASTER_CONTRACT_DELETED = "MASTER_CONTRACT_DELETED",

    // --- Needs ---
    NEED_CREATED = "NEED_CREATED",
    NEED_UPDATED = "NEED_UPDATED",
    NEED_DELETED = "NEED_DELETED",

    // --- Previous Studies ---
    PREVIOUS_STUDY_CREATED = "PREVIOUS_STUDY_CREATED",
    PREVIOUS_STUDY_UPDATED = "PREVIOUS_STUDY_UPDATED",
    PREVIOUS_STUDY_DELETED = "PREVIOUS_STUDY_DELETED",

    // --- Dependencies ---
    DEPENDENCY_CREATED = "DEPENDENCY_CREATED",
    DEPENDENCY_UPDATED = "DEPENDENCY_UPDATED",
    DEPENDENCY_DELETED = "DEPENDENCY_DELETED",

    // --- CDPs ---
    CDP_CREATED = "CDP_CREATED",
    CDP_UPDATED = "CDP_UPDATED",
    CDP_DELETED = "CDP_DELETED",
}

// ============================================================
// Tipos de Entidad
// ============================================================
export enum AuditEntityType {
    PROJECT = "Project",
    DEPENDENCY = "Dependency",
    FUNDING_SOURCE = "FundingSource",
    CDP = "Cdp",
    CDP_POSITION = "CdpPosition",
    CDP_POSITION_FUNDING = "CdpPositionFunding",
    MASTER_CONTRACT = "MasterContract",
    NEED = "Need",
    PREVIOUS_STUDY = "PreviousStudy",
    CONTRACTOR = "Contractor",
    POAI_PPA = "PoaiPpa",
    DETAILED_ACTIVITY = "DetailedActivity",
    MGA_ACTIVITY = "MgaActivity",
    MGA_DETAILED_RELATION = "MgaDetailedRelation",
    VARIABLE = "Variable",
    VARIABLE_GOAL = "VariableGoal",
    VARIABLE_QUADRENNIUM = "VariableQuadrennium",
    VARIABLE_LOCATION = "VariableLocation",
    RUBRIC = "Rubric",
    PRODUCT = "Product",
    INDICATIVE_INDICATOR = "IndicativePlanIndicator",
    INDICATIVE_INDICATOR_GOAL = "IndicativePlanIndicatorGoal",
    INDICATIVE_INDICATOR_QUADRENNIUM = "IndicativePlanIndicatorQuadrennium",
    ACTION_INDICATOR = "ActionPlanIndicator",
    ACTION_INDICATOR_GOAL = "ActionPlanIndicatorGoal",
    ACTION_INDICATOR_QUADRENNIUM = "ActionPlanIndicatorQuadrennium",
    VARIABLE_INDICATIVE_RELATION = "VariableIndicativeRelation",
    VARIABLE_ACTION_RELATION = "VariableActionRelation",
    PROJECT_ACTION_INDICATOR_RELATION = "ProjectActionIndicatorRelation",
    INDICATOR_LOCATION = "IndicatorLocation",
    FORMULA = "Formula",
    BUDGET_MODIFICATION = "BudgetModification",
    VARIABLE_ADVANCE = "VariableAdvance",
    INDICATOR_ADVANCE = "IndicatorAdvance",
    BUDGET_RECORD = "BudgetRecord",
    SAP_SYNC = "SapSync",
}

// ============================================================
// Labels legibles por acción
// ============================================================
export const ACTION_LABELS: Record<AuditAction, string> = {
    // Proyectos
    [AuditAction.PROJECT_CREATED]: "Proyecto Creado",
    [AuditAction.PROJECT_UPDATED]: "Proyecto Actualizado",
    [AuditAction.PROJECT_DELETED]: "Proyecto Eliminado",

    // Fuentes de Financiación
    [AuditAction.FUNDING_SOURCE_CREATED]: "Fuente de Financiación Creada",
    [AuditAction.FUNDING_SOURCE_UPDATED]: "Fuente de Financiación Actualizada",
    [AuditAction.FUNDING_SOURCE_DELETED]: "Fuente de Financiación Eliminada",

    // CDP
    [AuditAction.CDP_POSITION_OBSERVATIONS_UPDATED]: "Observaciones de Posición CDP Actualizadas",
    [AuditAction.CDP_ACTIVITY_ASSOCIATED]: "Actividad Asociada a Posición CDP",
    [AuditAction.CDP_ACTIVITY_DISASSOCIATED]: "Actividad Desasociada de Posición CDP",
    [AuditAction.CDP_ACTIVITY_CONSUMED]: "Consumo de Actividad en CDP",

    // POAI PPA
    [AuditAction.POAI_PPA_CREATED]: "Registro POAI PPA Creado",
    [AuditAction.POAI_PPA_UPDATED]: "Registro POAI PPA Actualizado",
    [AuditAction.POAI_PPA_DELETED]: "Registro POAI PPA Eliminado",

    // Actividades Detalladas
    [AuditAction.DETAILED_ACTIVITY_CREATED]: "Actividad Detallada Creada",
    [AuditAction.DETAILED_ACTIVITY_UPDATED]: "Actividad Detallada Actualizada",
    [AuditAction.DETAILED_ACTIVITY_DELETED]: "Actividad Detallada Eliminada",

    // Actividades MGA
    [AuditAction.MGA_ACTIVITY_CREATED]: "Actividad MGA Creada",
    [AuditAction.MGA_ACTIVITY_UPDATED]: "Actividad MGA Actualizada",
    [AuditAction.MGA_ACTIVITY_DELETED]: "Actividad MGA Eliminada",
    [AuditAction.MGA_DETAILED_RELATION_ADDED]: "Relación MGA-Detallada Agregada",
    [AuditAction.MGA_DETAILED_RELATION_REMOVED]: "Relación MGA-Detallada Removida",

    // Variables
    [AuditAction.VARIABLE_CREATED]: "Variable Creada",
    [AuditAction.VARIABLE_UPDATED]: "Variable Actualizada",
    [AuditAction.VARIABLE_DELETED]: "Variable Eliminada",

    // Metas de Variables
    [AuditAction.VARIABLE_GOAL_CREATED]: "Meta de Variable Creada",
    [AuditAction.VARIABLE_GOAL_UPDATED]: "Meta de Variable Actualizada",
    [AuditAction.VARIABLE_GOAL_DELETED]: "Meta de Variable Eliminada",

    // Cuatrienios de Variables
    [AuditAction.VARIABLE_QUADRENNIUM_CREATED]: "Cuatrienio de Variable Creado",
    [AuditAction.VARIABLE_QUADRENNIUM_UPDATED]: "Cuatrienio de Variable Actualizado",
    [AuditAction.VARIABLE_QUADRENNIUM_DELETED]: "Cuatrienio de Variable Eliminado",

    // Ubicaciones de Variables
    [AuditAction.VARIABLE_LOCATION_ADDED]: "Ubicación de Variable Agregada",
    [AuditAction.VARIABLE_LOCATION_REMOVED]: "Ubicación de Variable Removida",

    // Indicadores Plan Indicativo
    [AuditAction.INDICATIVE_INDICATOR_CREATED]: "Indicador Plan Indicativo Creado",
    [AuditAction.INDICATIVE_INDICATOR_UPDATED]: "Indicador Plan Indicativo Actualizado",
    [AuditAction.INDICATIVE_INDICATOR_DELETED]: "Indicador Plan Indicativo Eliminado",

    [AuditAction.INDICATIVE_INDICATOR_GOAL_CREATED]: "Meta de Indicador Plan Indicativo Creada",
    [AuditAction.INDICATIVE_INDICATOR_GOAL_UPDATED]: "Meta de Indicador Plan Indicativo Actualizada",
    [AuditAction.INDICATIVE_INDICATOR_GOAL_DELETED]: "Meta de Indicador Plan Indicativo Eliminada",

    [AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_CREATED]: "Cuatrienio de Indicador Plan Indicativo Creado",
    [AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_UPDATED]: "Cuatrienio de Indicador Plan Indicativo Actualizado",
    [AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_DELETED]: "Cuatrienio de Indicador Plan Indicativo Eliminado",

    // Indicadores Plan de Acción
    [AuditAction.ACTION_INDICATOR_CREATED]: "Indicador Plan de Acción Creado",
    [AuditAction.ACTION_INDICATOR_UPDATED]: "Indicador Plan de Acción Actualizado",
    [AuditAction.ACTION_INDICATOR_DELETED]: "Indicador Plan de Acción Eliminado",

    [AuditAction.ACTION_INDICATOR_GOAL_CREATED]: "Meta de Indicador Plan de Acción Creada",
    [AuditAction.ACTION_INDICATOR_GOAL_UPDATED]: "Meta de Indicador Plan de Acción Actualizada",
    [AuditAction.ACTION_INDICATOR_GOAL_DELETED]: "Meta de Indicador Plan de Acción Eliminada",

    [AuditAction.ACTION_INDICATOR_QUADRENNIUM_CREATED]: "Cuatrienio de Indicador Plan de Acción Creado",
    [AuditAction.ACTION_INDICATOR_QUADRENNIUM_UPDATED]: "Cuatrienio de Indicador Plan de Acción Actualizado",
    [AuditAction.ACTION_INDICATOR_QUADRENNIUM_DELETED]: "Cuatrienio de Indicador Plan de Acción Eliminado",

    // Relaciones Variable ↔ Indicador
    [AuditAction.VARIABLE_INDICATIVE_RELATION_ASSOCIATED]: "Variable Asociada a Indicador Indicativo",
    [AuditAction.VARIABLE_INDICATIVE_RELATION_DISASSOCIATED]: "Variable Desasociada de Indicador Indicativo",
    [AuditAction.VARIABLE_ACTION_RELATION_ASSOCIATED]: "Variable Asociada a Indicador de Acción",
    [AuditAction.VARIABLE_ACTION_RELATION_DISASSOCIATED]: "Variable Desasociada de Indicador de Acción",

    // Relaciones Proyecto ↔ Indicador de Acción
    [AuditAction.PROJECT_ACTION_INDICATOR_ASSOCIATED]: "Proyecto Asociado a Indicador de Acción",
    [AuditAction.PROJECT_ACTION_INDICATOR_DISASSOCIATED]: "Proyecto Desasociado de Indicador de Acción",

    // Ubicaciones de Indicadores
    [AuditAction.INDICATOR_LOCATION_ADDED]: "Ubicación de Indicador Agregada",
    [AuditAction.INDICATOR_LOCATION_REMOVED]: "Ubicación de Indicador Removida",

    // Fórmulas
    [AuditAction.FORMULA_CREATED]: "Fórmula Creada",
    [AuditAction.FORMULA_UPDATED]: "Fórmula Actualizada",

    // Modificaciones Presupuestales
    [AuditAction.BUDGET_MODIFICATION_CREATED]: "Modificación Presupuestal Creada",

    // Avances de Variables
    [AuditAction.VARIABLE_ADVANCE_CREATED]: "Avance de Variable Creado",
    [AuditAction.VARIABLE_ADVANCE_UPDATED]: "Avance de Variable Actualizado",

    // Avances de Indicadores
    [AuditAction.INDICATOR_ADVANCE_CREATED]: "Avance de Indicador Creado",
    [AuditAction.INDICATOR_ADVANCE_UPDATED]: "Avance de Indicador Actualizado",

    // Sincronización SAP
    [AuditAction.SAP_SYNC_REQUESTED]: "Sincronización SAP Solicitada",
    [AuditAction.SAP_SYNC_COMPLETED]: "Sincronización SAP Completada",
    [AuditAction.SAP_SYNC_FAILED]: "Sincronización SAP Fallida",

    // Rubrics
    [AuditAction.RUBRIC_CREATED]: "Rubro Creado",
    [AuditAction.RUBRIC_UPDATED]: "Rubro Actualizado",
    [AuditAction.RUBRIC_DELETED]: "Rubro Eliminado",

    // Products
    [AuditAction.PRODUCT_CREATED]: "Producto Creado",
    [AuditAction.PRODUCT_UPDATED]: "Producto Actualizado",
    [AuditAction.PRODUCT_DELETED]: "Producto Eliminado",

    // Contractors
    [AuditAction.CONTRACTOR_CREATED]: "Contratista Creado",
    [AuditAction.CONTRACTOR_UPDATED]: "Contratista Actualizado",
    [AuditAction.CONTRACTOR_DELETED]: "Contratista Eliminado",

    // Master Contracts
    [AuditAction.MASTER_CONTRACT_CREATED]: "Contrato Marco Creado",
    [AuditAction.MASTER_CONTRACT_UPDATED]: "Contrato Marco Actualizado",
    [AuditAction.MASTER_CONTRACT_DELETED]: "Contrato Marco Eliminado",

    // Needs
    [AuditAction.NEED_CREATED]: "Necesidad Creada",
    [AuditAction.NEED_UPDATED]: "Necesidad Actualizada",
    [AuditAction.NEED_DELETED]: "Necesidad Eliminada",

    // Previous Studies
    [AuditAction.PREVIOUS_STUDY_CREATED]: "Estudio Previo Creado",
    [AuditAction.PREVIOUS_STUDY_UPDATED]: "Estudio Previo Actualizado",
    [AuditAction.PREVIOUS_STUDY_DELETED]: "Estudio Previo Eliminado",

    // Dependencies
    [AuditAction.DEPENDENCY_CREATED]: "Dependencia Creada",
    [AuditAction.DEPENDENCY_UPDATED]: "Dependencia Actualizada",
    [AuditAction.DEPENDENCY_DELETED]: "Dependencia Eliminada",

    // CDPs
    [AuditAction.CDP_CREATED]: "CDP Creado",
    [AuditAction.CDP_UPDATED]: "CDP Actualizado",
    [AuditAction.CDP_DELETED]: "CDP Eliminado",
};

// ============================================================
// Labels legibles por campo
// ============================================================
export const FIELD_LABELS: Record<string, string> = {
    // Proyecto
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    initialBudget: "Presupuesto Inicial",
    currentBudget: "Presupuesto Actual",
    execution: "Ejecución",
    origin: "Origen",
    state: "Estado",

    // Fuente de Financiación
    // code, name ya definidos

    // CDP
    number: "Número",
    totalValue: "Valor Total",
    balance: "Saldo",
    dateIssue: "Fecha de Emisión",
    positionNumber: "Número de Posición",
    value: "Valor",
    observations: "Observaciones",
    assignedValue: "Valor Asignado",

    // POAI PPA
    year: "Año",
    projectedPoai: "POAI Proyectado",
    assignedPoai: "POAI Asignado",
    projectCode: "Código de Proyecto",

    // Actividades Detalladas
    activityDate: "Fecha de Actividad",
    budgetCeiling: "Techo Presupuestal",
    cpc: "CPC",

    // Actividades MGA
    // code, name, observations ya definidos

    // Variables
    // code, name, observations ya definidos

    // Indicadores
    programName: "Nombre del Programa",
    pillarName: "Nombre del Pilar",
    componentName: "Nombre del Componente",
    statisticalCode: "Código Estadístico",
    sequenceNumber: "Número de Secuencia",
    plannedQuantity: "Cantidad Planificada",
    executionCut: "Corte de Ejecución",
    compliancePercentage: "Porcentaje de Cumplimiento",

    // Fórmulas
    expression: "Expresión",
    formulaType: "Tipo de Fórmula",

    // Modificaciones Presupuestales
    modificationType: "Tipo de Modificación",
    legalDocument: "Documento Legal",
    previousBalance: "Saldo Anterior",
    newBalance: "Nuevo Saldo",
    previousRubricId: "Rubro Anterior",
    newRubricId: "Nuevo Rubro",

    // Comunes
    system: "Sistema",
    email: "Correo Electrónico",
    nit: "NIT",
    object: "Objeto",
    amount: "Monto",
};

// ============================================================
// Interfaces
// ============================================================
export interface AuditActor {
    id: string;
    email: string;
    name?: string;
}

export interface AuditChange {
    field: string;
    fieldLabel: string;
    oldValue: any;
    newValue: any;
}

export interface AuditError {
    code: string;
    message: string;
}

export interface AuditMetadata {
    [key: string]: any;
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    action: AuditAction;
    actionLabel: string;
    success: boolean;
    entityType: AuditEntityType;
    entityId: string;
    entityName?: string;
    actor?: AuditActor;
    system?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: AuditChange[];
    error?: AuditError;
    metadata?: AuditMetadata;
}

// ============================================================
// Helpers
// ============================================================
export function getFieldLabel(field: string): string {
    return FIELD_LABELS[field] || field;
}

export function getActionLabel(action: AuditAction): string {
    return ACTION_LABELS[action] || action;
}

export function buildChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
    fields: string[],
): AuditChange[] {
    const changes: AuditChange[] = [];
    for (const field of fields) {
        if (newData[field] !== undefined && oldData[field] !== newData[field]) {
            changes.push({
                field,
                fieldLabel: getFieldLabel(field),
                oldValue: oldData[field],
                newValue: newData[field],
            });
        }
    }
    return changes;
}
