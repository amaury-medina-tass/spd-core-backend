import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndicativePlanIndicator } from "./entities/indicative-plan/indicative-plan-indicator.entity";
import { IndicatorType } from "./entities/common/indicator-type.entity";
import { UnitMeasure } from "./entities/common/unit-measure.entity";
import { IndicatorDirection } from "./entities/common/indicator-direction.entity";
import { ActionPlanIndicatorsController } from "./controllers/action-plan/action-plan-indicators.controller";
import { ActionPlanIndicatorsService } from "./services/action-plan/action-plan-indicators.service";
import { ActionPlanIndicator } from "./entities/action-plan/action-plan-indicator.entity";
import { IndicativePlanIndicatorsController } from "./controllers/indicative-plan/indicative-plan-indicators.controller";
import { IndicativePlanIndicatorsService } from "./services/indicative-plan/indicative-plan-indicators.service";
import { IndicativePlanIndicatorGoal } from "./entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { IndicativePlanIndicatorQuadrennium } from "./entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { ActionPlanIndicatorGoal } from "./entities/action-plan/action-plan-indicator-goal.entity";
import { ActionPlanIndicatorQuadrennium } from "./entities/action-plan/action-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicatorGoalsController } from "./controllers/indicative-plan/indicative-plan-indicator-goals.controller";
import { IndicativePlanIndicatorQuadrenniumsController } from "./controllers/indicative-plan/indicative-plan-indicator-quadrenniums.controller";
import { ActionPlanIndicatorGoalsController } from "./controllers/action-plan/action-plan-indicator-goals.controller";
import { ActionPlanIndicatorQuadrenniumsController } from "./controllers/action-plan/action-plan-indicator-quadrenniums.controller";
import { IndicativePlanIndicatorGoalsService } from "./services/indicative-plan/indicative-plan-indicator-goals.service";
import { IndicativePlanIndicatorQuadrenniumsService } from "./services/indicative-plan/indicative-plan-indicator-quadrenniums.service";
import { ActionPlanIndicatorGoalsService } from "./services/action-plan/action-plan-indicator-goals.service";
import { ActionPlanIndicatorQuadrenniumsService } from "./services/action-plan/action-plan-indicator-quadrenniums.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IndicativePlanIndicator,
            IndicativePlanIndicatorGoal,
            IndicativePlanIndicatorQuadrennium,
            ActionPlanIndicator,
            ActionPlanIndicatorGoal,
            ActionPlanIndicatorQuadrennium,
            IndicatorType,
            UnitMeasure,
            IndicatorDirection,
        ]),
    ],
    controllers: [
        IndicativePlanIndicatorsController,
        ActionPlanIndicatorsController,
        IndicativePlanIndicatorGoalsController,
        IndicativePlanIndicatorQuadrenniumsController,
        ActionPlanIndicatorGoalsController,
        ActionPlanIndicatorQuadrenniumsController,
    ],
    providers: [
        IndicativePlanIndicatorsService,
        ActionPlanIndicatorsService,
        IndicativePlanIndicatorGoalsService,
        IndicativePlanIndicatorQuadrenniumsService,
        ActionPlanIndicatorGoalsService,
        ActionPlanIndicatorQuadrenniumsService,
    ],
    exports: [
        IndicativePlanIndicatorsService,
        ActionPlanIndicatorsService,
        IndicativePlanIndicatorGoalsService,
        IndicativePlanIndicatorQuadrenniumsService,
        ActionPlanIndicatorGoalsService,
        ActionPlanIndicatorQuadrenniumsService,
    ],
})
export class IndicatorsModule { }
