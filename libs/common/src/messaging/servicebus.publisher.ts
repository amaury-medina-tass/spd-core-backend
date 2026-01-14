export class ServiceBusPublisher {
  constructor(private connectionString: string, private topic: string) {}

  async publish(message: any, subjectPrefix?: string) {
    // eslint-disable-next-line no-console
    console.log(`[ServiceBusPublisher Mock] Publishing to ${this.topic} (Subject: ${subjectPrefix}${message.name})`, message);
  }
}
