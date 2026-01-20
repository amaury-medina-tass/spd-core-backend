/**
 * DTO para la fila de la tabla de CDPs
 * Contiene información consolidada de CDP con posiciones, proyectos, rubros, necesidades y fondos
 */
export class CdpTableRowDto {
    /** ID de la posición del CDP */
    id!: string;

    /** Código del Proyecto */
    projectCode!: string | null;

    /** Código Pospre (Rubro) */
    rubricCode!: string | null;

    /** Número de Posición del CDP */
    positionNumber!: string;

    /** Valor de la Posición */
    positionValue!: number | null;

    /** Código de la Necesidad */
    needCode!: string | null;

    /** Número del CDP */
    cdpNumber!: string;

    /** Valor Total del CDP */
    cdpTotalValue!: number | null;

    /** Origen del Presupuesto (Nombre del Fondo) */
    fundingSourceName!: string | null;

    /** Código del Fondo */
    fundingSourceCode!: string | null;

    /** Observaciones de la posición */
    observations!: string | null;
}
