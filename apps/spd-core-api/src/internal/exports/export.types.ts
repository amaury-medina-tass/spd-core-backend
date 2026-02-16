/**
 * Tipos compartidos para el sistema de exportación.
 */

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
}

export interface ExportColumn {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

export interface ExportResult {
  fileName: string;
  sheets: ExportSheet[];
}
