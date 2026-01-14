import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

// Reutilizamos config y DB del spd-core-api para mantener consistencia
import configuration from "../../spd-core-api/src/config/configuration";
import { envValidationSchema } from "../../spd-core-api/src/config/env.validation";
import { DatabaseModule } from "../../spd-core-api/src/database/database.module";

import { OutboxMessage } from "@common/entities/outbox-message.entity";
import { OutboxProcessor } from "./outbox/outbox.processor";
import { OutboxPublisher } from "./outbox/outbox.publisher";
import { SapSyncProcessor } from "./sap-sync/sap-sync.processor";
import { SapApiService } from "./sap-sync/sap-api.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([OutboxMessage]),
  ],
  providers: [OutboxPublisher, OutboxProcessor, SapSyncProcessor, SapApiService],
})
export class WorkerModule {}
