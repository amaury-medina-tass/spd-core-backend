import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanIndicativo } from "./plan-indicativo.entity";
import { MgaActivity } from "../../masters/activities/mga-activities/mga-activity.entity";
import { PlanIndicativoService } from "./services/plan-indicativo.service";
import { PlanIndicativoController } from "./controllers/plan-indicativo.controller";
import { OutboxModule } from "../../outbox/outbox.module";

@Module({
  imports: [TypeOrmModule.forFeature([PlanIndicativo, MgaActivity]), OutboxModule],
  providers: [PlanIndicativoService],
  controllers: [PlanIndicativoController],
})
export class PlanIndicativoModule {}
