import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { OutboxMessage } from "@common/entities/outbox-message.entity";
import { OutboxPublisher } from "./outbox.publisher";

// Eventos que se procesan localmente y NO deben publicarse al bus
const LOCAL_ONLY_EVENTS = [];

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  private readonly MAX_ATTEMPTS = 10;
  private readonly BATCH_SIZE = 30;

  constructor(
    @InjectRepository(OutboxMessage)
    private outbox: Repository<OutboxMessage>,
    private publisher: OutboxPublisher
  ) { }

  /**
   * ✅ cada 2 segundos procesa outbox
   * - Busca pendientes (excluyendo eventos locales como sap.sync.requested)
   * - Publica al bus
   * - Marca processed_at si ok
   * - Si falla, attempts++ y guarda last_error
   */
  @Cron("*/2 * * * * *")
  async tick() {
    // Obtener mensajes pendientes excluyendo los que se procesan localmente
    const batch = await this.outbox
      .createQueryBuilder("msg")
      .where("msg.processed_at IS NULL")
      .andWhere("msg.name NOT IN (:...localEvents)", { localEvents: LOCAL_ONLY_EVENTS })
      .orderBy("msg.occurred_at", "ASC")
      .take(this.BATCH_SIZE)
      .getMany();

    for (const msg of batch) {
      if ((msg.attempts ?? 0) >= this.MAX_ATTEMPTS) {
        this.logger.warn(`Skipping outbox msg ${msg.id}: max attempts reached`);
        continue;
      }

      try {
        // ✅ Envelope estándar (ideal para el bus)
        const envelope = {
          id: msg.id,
          name: msg.name,
          payload: msg.payload as any,
          headers: (msg as any).headers ?? {},
        };

        await this.publisher.publish(envelope as any);

        msg.processed_at = new Date();
        msg.updated_at = new Date();
        await this.outbox.save(msg);

        this.logger.log(`Published outbox: ${msg.name} (${msg.id})`);
      } catch (e: any) {
        msg.attempts = (msg.attempts ?? 0) + 1;
        msg.last_error = String(e?.message ?? e);
        msg.updated_at = new Date();
        await this.outbox.save(msg);

        this.logger.error(
          `Outbox publish failed: ${msg.id} attempts=${msg.attempts} err=${msg.last_error}`
        );
      }
    }
  }
}
