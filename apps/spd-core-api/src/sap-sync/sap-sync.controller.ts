import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermission } from "../common/decorators/require-permission.decorator";
import { SapSyncService } from "./sap-sync.service";
import { RequestSapSyncDto } from "./dto/request-sap-sync.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sap-sync")
export class SapSyncController {
  constructor(private readonly sapSyncService: SapSyncService) {}

  /**
   * Solicitar sincronización con SAP.
   * Encola una tarea de sincronización para que el worker la procese en segundo plano.
   * La respuesta es inmediata (202 Accepted) y el proceso se ejecuta asincrónicamente.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission("/sap-sync", "CREATE")
  async requestSync(@Body() dto: RequestSapSyncDto) {
    const job = await this.sapSyncService.enqueueSync(dto);

    return {
      success: true,
      message: "Sincronización encolada",
      data: {
        jobId: job.id,
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin,
      },
    };
  }
}
