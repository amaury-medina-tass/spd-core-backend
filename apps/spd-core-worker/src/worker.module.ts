import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

// Reutilizamos config y DB del spd-core-api para mantener consistencia
import configuration from "../../spd-core-api/src/config/configuration";
import { envValidationSchema } from "../../spd-core-api/src/config/env.validation";
import { DatabaseModule } from "../../spd-core-api/src/database/database.module";

import { OutboxProcessor } from "./outbox/outbox.processor";
import { OutboxPublisher } from "./outbox/outbox.publisher";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
  providers: [OutboxPublisher, OutboxProcessor],
})
export class WorkerModule {}
