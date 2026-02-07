import { Controller, Get, Param, Query } from "@nestjs/common";
import { InternalExportsService } from "./internal-exports.service";

/**
 * Endpoints internos para comunicación entre microservicios.
 * NO llevan autenticación JWT — están protegidos a nivel de red
 * (solo accesibles dentro de la red de Docker / VNet de Azure).
 *
 * Contrato:
 *   GET /internal/exports/:type?search=...
 *   → { fileName, sheets: [{ name, columns, data }] }
 */
@Controller("internal/exports")
export class InternalExportsController {
  constructor(private readonly exportsService: InternalExportsService) {}

  @Get(":type")
  async getExportData(
    @Param("type") type: string,
    @Query("search") search?: string,
  ) {
    // Construir filtros a partir de query params
    const filters: Record<string, any> = {};
    if (search) filters.search = search;

    return this.exportsService.getExportData(type, filters);
  }
}
