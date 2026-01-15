import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OutboxMessage } from "@common/entities/outbox-message.entity";

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxMessage)
    private readonly repo: Repository<OutboxMessage>
  ) { }

  /**
   * ✅ Encola un evento para que el worker lo publique.
   * - Esto permite que el API sea rápido y resiliente (outbox pattern).
   */
  async enqueue(
    name: string,
    payload: Record<string, any>,
    headers: Record<string, any> = {}
  ): Promise<OutboxMessage> {
    const msg = this.repo.create({
      name,
      payload,
      headers,
      occurred_at: new Date(),
      attempts: 0,
    } as any);

    return (await this.repo.save(msg)) as unknown as OutboxMessage;
  }
}
