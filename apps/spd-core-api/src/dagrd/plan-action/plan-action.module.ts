import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanAction } from "./plan-action.entity";
import { DetailedActivity } from "../../masters/activities/detailed-activities/detailed-activity.entity";
import { PlanActionService } from "./services/plan-action.service";
import { PlanActionController } from "./controllers/plan-action.controller";
import { OutboxModule } from "../../outbox/outbox.module";

@Module({
  imports: [TypeOrmModule.forFeature([PlanAction, DetailedActivity]), OutboxModule],
  providers: [PlanActionService],
  controllers: [PlanActionController],
})
export class PlanActionModule {}
