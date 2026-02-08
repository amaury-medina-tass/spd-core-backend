export const ErrorCodes = {
    // ============================================================
    // Proyectos
    // ============================================================
    PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
    PROJECT_ALREADY_EXISTS: "PROJECT_ALREADY_EXISTS",
    PROJECT_HAS_DEPENDENCIES: "PROJECT_HAS_DEPENDENCIES",

    // ============================================================
    // Dependencias
    // ============================================================
    DEPENDENCY_NOT_FOUND: "DEPENDENCY_NOT_FOUND",

    // ============================================================
    // Fuentes de Financiación
    // ============================================================
    FUNDING_SOURCE_NOT_FOUND: "FUNDING_SOURCE_NOT_FOUND",
    FUNDING_SOURCE_ALREADY_EXISTS: "FUNDING_SOURCE_ALREADY_EXISTS",
    FUNDING_SOURCE_IN_USE: "FUNDING_SOURCE_IN_USE",

    // ============================================================
    // CDP
    // ============================================================
    CDP_NOT_FOUND: "CDP_NOT_FOUND",
    CDP_POSITION_NOT_FOUND: "CDP_POSITION_NOT_FOUND",
    CDP_POSITION_HAS_FUNDS: "CDP_POSITION_HAS_FUNDS",
    CDP_ACTIVITY_ALREADY_ASSOCIATED: "CDP_ACTIVITY_ALREADY_ASSOCIATED",
    CDP_ACTIVITY_NOT_ASSOCIATED: "CDP_ACTIVITY_NOT_ASSOCIATED",
    CDP_ACTIVITY_HAS_FUNDS: "CDP_ACTIVITY_HAS_FUNDS",
    CDP_ACTIVITY_IN_USE: "CDP_ACTIVITY_IN_USE",
    CDP_ACTIVITY_WRONG_PROJECT: "CDP_ACTIVITY_WRONG_PROJECT",
    CDP_INSUFFICIENT_BALANCE: "CDP_INSUFFICIENT_BALANCE",
    CDP_INVALID_AMOUNT: "CDP_INVALID_AMOUNT",

    // ============================================================
    // Contratos Marco
    // ============================================================
    MASTER_CONTRACT_NOT_FOUND: "MASTER_CONTRACT_NOT_FOUND",

    // ============================================================
    // Necesidades
    // ============================================================
    NEED_NOT_FOUND: "NEED_NOT_FOUND",

    // ============================================================
    // Estudios Previos
    // ============================================================
    PREVIOUS_STUDY_NOT_FOUND: "PREVIOUS_STUDY_NOT_FOUND",

    // ============================================================
    // Contratistas
    // ============================================================
    CONTRACTOR_NOT_FOUND: "CONTRACTOR_NOT_FOUND",

    // ============================================================
    // POAI PPA
    // ============================================================
    POAI_PPA_NOT_FOUND: "POAI_PPA_NOT_FOUND",
    POAI_PPA_ALREADY_EXISTS: "POAI_PPA_ALREADY_EXISTS",

    // ============================================================
    // Actividades Detalladas
    // ============================================================
    DETAILED_ACTIVITY_NOT_FOUND: "DETAILED_ACTIVITY_NOT_FOUND",
    DETAILED_ACTIVITY_ALREADY_EXISTS: "DETAILED_ACTIVITY_ALREADY_EXISTS",
    DETAILED_ACTIVITY_IN_USE: "DETAILED_ACTIVITY_IN_USE",

    // ============================================================
    // Actividades MGA
    // ============================================================
    MGA_ACTIVITY_NOT_FOUND: "MGA_ACTIVITY_NOT_FOUND",
    MGA_ACTIVITY_ALREADY_EXISTS: "MGA_ACTIVITY_ALREADY_EXISTS",
    MGA_DETAILED_RELATION_ALREADY_EXISTS: "MGA_DETAILED_RELATION_ALREADY_EXISTS",
    MGA_DETAILED_RELATION_NOT_FOUND: "MGA_DETAILED_RELATION_NOT_FOUND",

    // ============================================================
    // Variables
    // ============================================================
    VARIABLE_NOT_FOUND: "VARIABLE_NOT_FOUND",
    VARIABLE_ALREADY_EXISTS: "VARIABLE_ALREADY_EXISTS",
    VARIABLE_IN_USE: "VARIABLE_IN_USE",

    // ============================================================
    // Metas de Variables
    // ============================================================
    VARIABLE_GOAL_NOT_FOUND: "VARIABLE_GOAL_NOT_FOUND",
    VARIABLE_GOAL_ALREADY_EXISTS: "VARIABLE_GOAL_ALREADY_EXISTS",

    // ============================================================
    // Cuatrienios de Variables
    // ============================================================
    VARIABLE_QUADRENNIUM_NOT_FOUND: "VARIABLE_QUADRENNIUM_NOT_FOUND",
    VARIABLE_QUADRENNIUM_ALREADY_EXISTS: "VARIABLE_QUADRENNIUM_ALREADY_EXISTS",

    // ============================================================
    // Ubicaciones de Variables
    // ============================================================
    VARIABLE_LOCATION_NOT_FOUND: "VARIABLE_LOCATION_NOT_FOUND",
    VARIABLE_LOCATION_ALREADY_EXISTS: "VARIABLE_LOCATION_ALREADY_EXISTS",

    // ============================================================
    // Rubros
    // ============================================================
    RUBRIC_NOT_FOUND: "RUBRIC_NOT_FOUND",

    // ============================================================
    // Productos
    // ============================================================
    PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",

    // ============================================================
    // Indicadores Plan Indicativo
    // ============================================================
    INDICATIVE_INDICATOR_NOT_FOUND: "INDICATIVE_INDICATOR_NOT_FOUND",
    INDICATIVE_INDICATOR_ALREADY_EXISTS: "INDICATIVE_INDICATOR_ALREADY_EXISTS",
    INDICATIVE_INDICATOR_GOAL_NOT_FOUND: "INDICATIVE_INDICATOR_GOAL_NOT_FOUND",
    INDICATIVE_INDICATOR_QUADRENNIUM_NOT_FOUND: "INDICATIVE_INDICATOR_QUADRENNIUM_NOT_FOUND",

    // ============================================================
    // Indicadores Plan de Acción
    // ============================================================
    ACTION_INDICATOR_NOT_FOUND: "ACTION_INDICATOR_NOT_FOUND",
    ACTION_INDICATOR_ALREADY_EXISTS: "ACTION_INDICATOR_ALREADY_EXISTS",
    ACTION_INDICATOR_GOAL_NOT_FOUND: "ACTION_INDICATOR_GOAL_NOT_FOUND",
    ACTION_INDICATOR_QUADRENNIUM_NOT_FOUND: "ACTION_INDICATOR_QUADRENNIUM_NOT_FOUND",

    // ============================================================
    // Relaciones Variable-Indicador
    // ============================================================
    VARIABLE_INDICATOR_RELATION_ALREADY_EXISTS: "VARIABLE_INDICATOR_RELATION_ALREADY_EXISTS",
    VARIABLE_INDICATOR_RELATION_NOT_FOUND: "VARIABLE_INDICATOR_RELATION_NOT_FOUND",

    // ============================================================
    // Relaciones Proyecto-Indicador de Acción
    // ============================================================
    PROJECT_ACTION_INDICATOR_RELATION_ALREADY_EXISTS: "PROJECT_ACTION_INDICATOR_RELATION_ALREADY_EXISTS",
    PROJECT_ACTION_INDICATOR_RELATION_NOT_FOUND: "PROJECT_ACTION_INDICATOR_RELATION_NOT_FOUND",

    // ============================================================
    // Ubicaciones de Indicadores
    // ============================================================
    INDICATOR_LOCATION_NOT_FOUND: "INDICATOR_LOCATION_NOT_FOUND",
    INDICATOR_LOCATION_ALREADY_EXISTS: "INDICATOR_LOCATION_ALREADY_EXISTS",

    // ============================================================
    // Fórmulas
    // ============================================================
    FORMULA_NOT_FOUND: "FORMULA_NOT_FOUND",
    FORMULA_INVALID_INDICATOR: "FORMULA_INVALID_INDICATOR",

    // ============================================================
    // Modificaciones Presupuestales
    // ============================================================
    BUDGET_MODIFICATION_NOT_FOUND: "BUDGET_MODIFICATION_NOT_FOUND",
    BUDGET_MODIFICATION_INVALID_VALUE: "BUDGET_MODIFICATION_INVALID_VALUE",
    BUDGET_MODIFICATION_INSUFFICIENT_BALANCE: "BUDGET_MODIFICATION_INSUFFICIENT_BALANCE",
    BUDGET_MODIFICATION_SAME_RUBRIC: "BUDGET_MODIFICATION_SAME_RUBRIC",
    BUDGET_MODIFICATION_UNSUPPORTED_TYPE: "BUDGET_MODIFICATION_UNSUPPORTED_TYPE",

    // ============================================================
    // Avances de Variables (SUB)
    // ============================================================
    VARIABLE_ADVANCE_NOT_FOUND: "VARIABLE_ADVANCE_NOT_FOUND",

    // ============================================================
    // Avances de Indicadores (SUB)
    // ============================================================
    INDICATOR_ADVANCE_NOT_FOUND: "INDICATOR_ADVANCE_NOT_FOUND",

    // ============================================================
    // Sincronización SAP
    // ============================================================
    SAP_SYNC_FAILED: "SAP_SYNC_FAILED",

    // ============================================================
    // Registros Presupuestales
    // ============================================================
    BUDGET_RECORD_NOT_FOUND: "BUDGET_RECORD_NOT_FOUND",

    // ============================================================
    // Ubicaciones / Comunas
    // ============================================================
    LOCATION_NOT_FOUND: "LOCATION_NOT_FOUND",
    COMMUNE_NOT_FOUND: "COMMUNE_NOT_FOUND",

    // ============================================================
    // Asignación de Usuarios a Indicadores/Variables
    // ============================================================
    INDICATOR_USER_ALREADY_ASSIGNED: "INDICATOR_USER_ALREADY_ASSIGNED",
    INDICATOR_USER_NOT_ASSIGNED: "INDICATOR_USER_NOT_ASSIGNED",
    VARIABLE_USER_ALREADY_ASSIGNED: "VARIABLE_USER_ALREADY_ASSIGNED",
    VARIABLE_USER_NOT_ASSIGNED: "VARIABLE_USER_NOT_ASSIGNED",

    // ============================================================
    // General
    // ============================================================
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    FORBIDDEN: "FORBIDDEN",
    VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
