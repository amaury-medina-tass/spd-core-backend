import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
  // No HTTP server, solo contexto para cron/worker
}
bootstrap();
