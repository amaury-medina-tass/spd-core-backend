import { Injectable, Logger } from "@nestjs/common";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { SYSTEM_NAME } from "../shared/constants";
import { OutboxService } from "../outbox/outbox.service";
import { RequestSapSyncDto } from "./dto/request-sap-sync.dto";

export const SAP_SYNC_EVENT_NAME = "sap.sync.requested";

@Injectable()
export class SapSyncService {
  private readonly logger = new Logger(SapSyncService.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Encola una solicitud de sincronización con SAP.
   * El worker procesará este job en segundo plano.
   */
  async enqueueSync(dto: RequestSapSyncDto) {
    this.logger.log(
      `Encolando sincronización SAP: ${dto.fechaInicio} - ${dto.fechaFin}`
    );

    const job = await this.outboxService.enqueue(
      SAP_SYNC_EVENT_NAME,
      {
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin,
        codSecretaria: dto.codSecretaria ?? "221",
        requestedAt: new Date().toISOString(),
      },
      {
        source: "api",
        type: "sync-request",
      }
    );

    this.logger.log(`Job encolado con ID: ${job.id}`);

    await this.auditLog.logSuccess(AuditAction.SAP_SYNC_REQUESTED, AuditEntityType.SAP_SYNC, job.id, {
      entityName: `SAP Sync ${dto.fechaInicio} - ${dto.fechaFin}`,
      system: SYSTEM_NAME,
      metadata: { fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin, codSecretaria: dto.codSecretaria ?? "221" },
    });

    return job;
  }
}
