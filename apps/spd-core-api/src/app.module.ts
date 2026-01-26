import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { OutboxModule } from "./outbox/outbox.module";

import { JwtStrategy } from "./auth/strategies/jwt.strategy";

import { MastersModule } from "./masters/masters.module";
import { FinancialModule } from "./financial/financial.module";
import { SapSyncModule } from "./sap-sync/sap-sync.module";
import { RedisModule } from "@common/redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    OutboxModule,

    MastersModule,
    FinancialModule,
    MastersModule,
    FinancialModule,
    SapSyncModule,
    RedisModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule { }
