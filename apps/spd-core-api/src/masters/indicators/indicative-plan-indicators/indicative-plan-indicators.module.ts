import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndicativePlanIndicator } from "./indicative-plan-indicator.entity";
import { IndicativePlanIndicatorsService } from "./services/indicative-plan-indicators.service";
import { IndicativePlanIndicatorsController } from "./controllers/indicative-plan-indicators.controller";
import { Variable } from "../../variables/variable.entity";

@Module({
  imports: [TypeOrmModule.forFeature([IndicativePlanIndicator, Variable])],
  providers: [IndicativePlanIndicatorsService],
  controllers: [IndicativePlanIndicatorsController],
  exports: [IndicativePlanIndicatorsService],
})
export class IndicativePlanIndicatorsModule {}
