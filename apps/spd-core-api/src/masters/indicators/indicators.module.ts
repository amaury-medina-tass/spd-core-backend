import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndicativePlanIndicator } from "./entities/indicative-plan-indicator.entity";
import { IndicatorType } from "./entities/indicator-type.entity";
import { UnitMeasure } from "./entities/unit-measure.entity";
import { IndicatorDirection } from "./entities/indicator-direction.entity";
import { ActionPlanIndicatorsController } from "./controllers/action-plan-indicators.controller";
import { ActionPlanIndicatorsService } from "./services/action-plan-indicators.service";
import { ActionPlanIndicator } from "./entities/action-plan-indicator.entity";
import { IndicativePlanIndicatorsController } from "./controllers/indicative-plan-indicators.controller";
import { IndicativePlanIndicatorsService } from "./services/indicative-plan-indicators.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IndicativePlanIndicator,
            ActionPlanIndicator,
            IndicatorType,
            UnitMeasure,
            IndicatorDirection,
        ]),
    ],
    controllers: [IndicativePlanIndicatorsController, ActionPlanIndicatorsController],
    providers: [IndicativePlanIndicatorsService, ActionPlanIndicatorsService],
    exports: [IndicativePlanIndicatorsService, ActionPlanIndicatorsService],
})
export class IndicatorsModule { }
