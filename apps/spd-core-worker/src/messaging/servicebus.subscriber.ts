import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { 
  ServiceBusClient, 
  ServiceBusReceivedMessage,
  ProcessErrorArgs,
  ServiceBusReceiver 
} from "@azure/service-bus";
import { SapSyncService } from "../sap-sync/sap-sync.service";

const SAP_SYNC_EVENT_NAME = "sap.sync.requested";

@Injectable()
export class ServiceBusSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusSubscriber.name);

  private client: ServiceBusClient | null = null;
  private receiver: ServiceBusReceiver | null = null;

  constructor(
    private readonly cfg: ConfigService,
    private readonly sapSyncService: SapSyncService,
  ) {}

  async onModuleInit() {
    const cs = this.cfg.get<string>("serviceBus.connectionString") ?? "";
    const topic = this.cfg.get<string>("serviceBus.topic") ?? "spd.events";
    const subscription = this.cfg.get<string>("serviceBus.subscription") ?? "spd-worker";

    if (!cs) {
      this.logger.warn("SERVICEBUS_CONNECTION_STRING not set, subscriber disabled");
      return;
    }

    try {
      this.client = new ServiceBusClient(cs);
      this.receiver = this.client.createReceiver(topic, subscription);

      // Subscribe to messages
      this.receiver.subscribe({
        processMessage: this.handleMessage.bind(this),
        processError: this.handleError.bind(this),
      });

      this.logger.log(`✅ Subscribed to ${topic}/${subscription}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize subscriber: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.receiver) {
      await this.receiver.close();
    }
    if (this.client) {
      await this.client.close();
    }
    this.logger.log("ServiceBus subscriber closed");
  }

  private async handleMessage(message: ServiceBusReceivedMessage): Promise<void> {
    const eventName = message.applicationProperties?.eventName as string;
    const subject = message.subject;

    this.logger.log(`📩 Received message: ${subject} (event: ${eventName})`);
    this.logger.debug(`Body: ${JSON.stringify(message.body)}`);

    try {
      // Route to appropriate handler based on event name
      if (eventName === SAP_SYNC_EVENT_NAME || subject?.includes("sap.sync.requested")) {
        const payload = message.body as {
          fechaInicio: string;
          fechaFin: string;
          codSecretaria: string;
        };

        this.logger.log(
          `Processing SAP sync: ${payload.fechaInicio} - ${payload.fechaFin}`
        );

        // Future improvement: integrate SapSyncService to process SAP items
        // await this.sapSyncService.processSapItems(...);
        
        this.logger.log(`SAP sync message processed`);
      } else {
        this.logger.warn(`Unknown event: ${eventName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing message: ${error.message}`);
      throw error; // Re-throw to trigger retry/dead-letter
    }
  }

  private async handleError(args: ProcessErrorArgs): Promise<void> {
    this.logger.error(
      `ServiceBus error: ${args.error.message}`,
      args.error.stack
    );
  }
}
