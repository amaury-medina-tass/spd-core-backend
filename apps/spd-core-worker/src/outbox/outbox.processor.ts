import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OutboxMessage } from "@common/entities/outbox-message.entity";
import { OutboxPublisher } from "./outbox.publisher";

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  private readonly MAX_ATTEMPTS = 10;
  private readonly BATCH_SIZE = 30;

  constructor(
    @InjectRepository(OutboxMessage)
    private outbox: Repository<OutboxMessage>,
    private publisher: OutboxPublisher
  ) {}

  /**
   * ✅ cada 2 segundos procesa outbox
   * - Busca pendientes
   * - Publica
   * - Marca processed_at si ok
   * - Si falla, attempts++ y guarda last_error
   */
  @Cron("*/2 * * * * *")
  async tick() {
    const batch = await this.outbox.find({
      where: { processed_at: null },
      order: { occurred_at: "ASC" },
      take: this.BATCH_SIZE,
    });

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
