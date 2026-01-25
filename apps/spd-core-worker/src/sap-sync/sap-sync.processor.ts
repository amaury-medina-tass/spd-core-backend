import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { OutboxMessage } from "@common/entities/outbox-message.entity";
import { SapApiService } from "./sap-api.service";
import { SapSyncService } from "./sap-sync.service";

const SAP_SYNC_EVENT_NAME = "sap.sync.requested";

@Injectable()
export class SapSyncProcessor {
  private readonly logger = new Logger(SapSyncProcessor.name);
  private readonly MAX_ATTEMPTS = 5;
  private isProcessing = false; // Evitar procesamiento concurrente

  constructor(
    @InjectRepository(OutboxMessage)
    private readonly outbox: Repository<OutboxMessage>,
    private readonly sapApi: SapApiService,
    private readonly sapSyncService: SapSyncService
  ) { }

  /**
   * Cada 10 segundos busca jobs de sincronización SAP pendientes y los procesa.
   */
  @Cron("*/10 * * * * *")
  async processSyncJobs() {
    // Evitar que múltiples ejecuciones del cron se solapen
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const jobs = await this.outbox.find({
        where: {
          name: SAP_SYNC_EVENT_NAME,
          processed_at: IsNull(), // ✅ Usar IsNull() de TypeORM en lugar de undefined
        },
        order: { occurred_at: "ASC" },
        take: 1, // Procesar uno a la vez para evitar saturar SAP
      });

      for (const job of jobs) {
        if ((job.attempts ?? 0) >= this.MAX_ATTEMPTS) {
          this.logger.warn(
            `Saltando job ${job.id}: máximo de intentos alcanzado (${job.attempts})`
          );
          continue;
        }

        await this.processJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: OutboxMessage) {
    const { fechaInicio, fechaFin, codSecretaria } = job.payload as {
      fechaInicio: string;
      fechaFin: string;
      codSecretaria: string;
    };

    this.logger.log(
      `Procesando sincronización SAP: ${fechaInicio} - ${fechaFin} (Job: ${job.id})`
    );

    try {
      // 1. Obtener datos de SAP
      const sapData = await this.sapApi.fetchContracts(
        fechaInicio,
        fechaFin,
        codSecretaria
      );

      this.logger.log(`Recibidos ${sapData.items.length} contratos de SAP`);

      if (sapData.items.length === 0) {
        this.logger.warn("No hay contratos para sincronizar");
        await this.markAsProcessed(job);
        return;
      }

      // 2. Sincronizar usando TypeORM
      await this.sapSyncService.processSapItems(sapData.items);

      // 3. Marcar como procesado
      await this.markAsProcessed(job);

      this.logger.log(`✅ Sincronización completada para job ${job.id}`);
    } catch (error: any) {
      this.logger.error(
        `❌ Error procesando job ${job.id}: ${error.message}`,
        error.stack
      );

      job.attempts = (job.attempts ?? 0) + 1;
      job.last_error = error.message;
      job.updated_at = new Date();
      await this.outbox.save(job);
    }
  }

  private async markAsProcessed(job: OutboxMessage) {
    job.processed_at = new Date();
    job.updated_at = new Date();
    await this.outbox.save(job);
  }
}
