import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Variable } from "../../variables/variable.entity"; // Need to register Variable repo too if used in service

// NOTE: check if Variable needs to be imported here or if it works via forFeature in Service
// Usually we need `TypeOrmModule.forFeature([ActionPlanIndicator, Variable])`
import { ActionPlanIndicator } from "./action-plan-indicator.entity";
import { ActionPlanIndicatorsService } from "./services/action-plan-indicators.service";
import { ActionPlanIndicatorsController } from "./controllers/action-plan-indicators.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ActionPlanIndicator, Variable])],
  providers: [ActionPlanIndicatorsService],
  controllers: [ActionPlanIndicatorsController],
  exports: [ActionPlanIndicatorsService],
})
export class ActionPlanIndicatorsModule {}
