import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";

export class ServiceBusPublisher {
  private readonly client: ServiceBusClient;
  private readonly sender: ServiceBusSender;

  constructor(connectionString: string, topic: string) {
    this.client = new ServiceBusClient(connectionString);
    this.sender = this.client.createSender(topic);
  }

  async publish(message: any, subjectPrefix?: string) {
    const subject = `${subjectPrefix ?? ""}${message.name}`;
    
    await this.sender.sendMessages({
      body: message.payload,
      subject,
      applicationProperties: {
        eventId: message.id,
        eventName: message.name,
        ...message.headers,
      },
      contentType: "application/json",
    });

    // eslint-disable-next-line no-console
    console.log(`[ServiceBusPublisher] Published to topic (Subject: ${subject})`);
  }

  async close() {
    await this.sender.close();
    await this.client.close();
  }
}
