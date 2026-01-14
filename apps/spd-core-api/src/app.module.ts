import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { OutboxModule } from "./outbox/outbox.module";

import { JwtStrategy } from "./auth/strategies/jwt.strategy";

import { MastersModule } from "./masters/masters.module";
import { FinancieroModule } from "./financiero/financiero.module";
import { DagrdModule } from "./dagrd/dagrd.module";
import { SubModule } from "./sub/sub.module";
import { ContratosModule } from "./contratos/contratos.module";

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
    FinancieroModule,
    DagrdModule,
    SubModule,
    ContratosModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
