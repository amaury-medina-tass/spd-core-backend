import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ServiceBusPublisher } from "@common/messaging/servicebus.publisher";
import type { OutboxEventEnvelope } from "@common/types/events";

@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);

  private publisher: ServiceBusPublisher | null = null;
  private subjectPrefix: string;

  constructor(private cfg: ConfigService) {
    const cs = this.cfg.get<string>("serviceBus.connectionString") ?? "";
    const topic = this.cfg.get<string>("serviceBus.topic") ?? "spd.events";
    this.subjectPrefix = this.cfg.get<string>("serviceBus.subjectPrefix") ?? "SpdCore.";

    /**
     * ✅ Para probar local SIN Azure:
     * Deja SERVICEBUS_CONNECTION_STRING vacío -> publisher queda null -> usamos logs (mock)
     */
    if (cs) {
      this.publisher = new ServiceBusPublisher(cs, topic);
    }
  }

  async publish(envelope: OutboxEventEnvelope) {
    // ✅ MODO PRUEBA (sin Azure)
    if (!this.publisher) {
      this.logger.log(
        `[MOCK PUBLISH] ${envelope.name} payload=${JSON.stringify(envelope.payload)}`
      );
      return;
    }

    // ✅ PRODUCCIÓN (Azure)
    await this.publisher.publish(envelope, this.subjectPrefix);
  }
}
