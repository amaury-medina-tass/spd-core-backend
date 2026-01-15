import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cdp } from "./cdp.entity";
import { DetailedActivity } from "../../masters/activities/detailed-activities/detailed-activity.entity";
import { CdpService } from "./services/cdp.service";
import { CdpController } from "./controllers/cdp.controller";
import { OutboxModule } from "../../outbox/outbox.module";

@Module({
  imports: [TypeOrmModule.forFeature([Cdp, DetailedActivity]), OutboxModule],
  providers: [CdpService],
  controllers: [CdpController],
})
export class CdpModule {}
