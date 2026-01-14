import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { OutboxMessage } from "@common/entities/outbox-message.entity";
import { SapApiService } from "./sap-api.service";

const SAP_SYNC_EVENT_NAME = "sap.sync.requested";

@Injectable()
export class SapSyncProcessor {
  private readonly logger = new Logger(SapSyncProcessor.name);
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    @InjectRepository(OutboxMessage)
    private readonly outbox: Repository<OutboxMessage>,
    private readonly sapApi: SapApiService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Cada 10 segundos busca jobs de sincronización SAP pendientes y los procesa.
   */
  @Cron("*/10 * * * * *")
  async processSyncJobs() {
    const jobs = await this.outbox.find({
      where: {
        name: SAP_SYNC_EVENT_NAME,
        processed_at: undefined,
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

      // 2. Llamar al SP con los datos
      await this.callStoredProcedure(sapData);

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

  /**
   * Ejecuta el stored procedure SP_SYNCHRONIZE_SAP_DG con los datos de SAP.
   */
  private async callStoredProcedure(data: { items: any[] }) {
    this.logger.log("Ejecutando SP_SYNCHRONIZE_SAP_DG...");

    const jsonParam = JSON.stringify(data);

    await this.dataSource.query(
      `CALL sicgem_app."SP_SYNCHRONIZE_SAP_DG"($1::jsonb)`,
      [jsonParam]
    );

    this.logger.log("SP_SYNCHRONIZE_SAP_DG ejecutado exitosamente");
  }

  private async markAsProcessed(job: OutboxMessage) {
    job.processed_at = new Date();
    job.updated_at = new Date();
    await this.outbox.save(job);
  }
}
