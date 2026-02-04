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
import { ServiceBusSubscriber } from "./messaging/servicebus.subscriber";
import { SapSyncProcessor } from "./sap-sync/sap-sync.processor";
import { SapApiService } from "./sap-sync/sap-api.service";
import { SapSyncService } from "./sap-sync/sap-sync.service";

// Entidades usadas por SapSyncService
import { Dependency } from "../../spd-core-api/src/financial/dependencies/entities/dependency.entity";
import { Contractor } from "../../spd-core-api/src/financial/contractors/entities/contractor.entity";
import { FundingSource } from "../../spd-core-api/src/financial/funding-sources/entities/funding-source.entity";
import { Rubric } from "../../spd-core-api/src/masters/rubrics/entities/rubric.entity";
import { Project } from "../../spd-core-api/src/financial/projects/entities/project.entity";
import { PreviousStudy } from "../../spd-core-api/src/financial/previous-studies/entities/previous-study.entity";
import { Need } from "../../spd-core-api/src/financial/needs/entities/need.entity";
import { Cdp } from "../../spd-core-api/src/financial/cdps/entities/cdp.entity";
import { CdpProject } from "../../spd-core-api/src/financial/cdps/entities/cdp-project.entity";
import { CdpPosition } from "../../spd-core-api/src/financial/cdps/entities/cdp-position.entity";
import { CdpPositionFunding } from "../../spd-core-api/src/financial/cdps/entities/cdp-position-funding.entity";
import { MasterContract } from "../../spd-core-api/src/financial/master-contracts/entities/master-contract.entity";
import { ContractCdpRelation } from "../../spd-core-api/src/financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { ContractPosition } from "../../spd-core-api/src/financial/contract-positions/entities/contract-position.entity";
import { BudgetRecord } from "../../spd-core-api/src/financial/budget-records/entities/budget-record.entity";
import { DetailedActivity } from "../../spd-core-api/src/masters/detailed-activities/entities/detailed-activity.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      OutboxMessage,
      // Entidades para sincronización SAP
      Dependency,
      Contractor,
      FundingSource,
      Rubric,
      Project,
      PreviousStudy,
      Need,
      Cdp,
      CdpProject,
      CdpPosition,
      CdpPositionFunding,
      MasterContract,
      ContractCdpRelation,
      ContractPosition,
      BudgetRecord,
      DetailedActivity,
    ]),
  ],
  providers: [OutboxPublisher, OutboxProcessor, ServiceBusSubscriber, SapSyncProcessor, SapApiService, SapSyncService],
})
export class WorkerModule { }
