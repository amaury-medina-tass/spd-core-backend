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
import { VariableIndicativeRelationsService } from "./services/indicative-plan/variable-indicative-relations.service";
import { VariableActionRelationsService } from "./services/action-plan/variable-action-relations.service";
import { VariableIndicativeRelationsController } from "./controllers/indicative-plan/variable-indicative-relations.controller";
import { VariableActionRelationsController } from "./controllers/action-plan/variable-action-relations.controller";
import { VariableIndicativeRelation } from "./entities/indicative-plan/variable-indicative-relation.entity";
import { VariableActionRelation } from "./entities/action-plan/variable-action-relation.entity";
import { Variable } from "../variables/entities/variable.entity";

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
            VariableIndicativeRelation,
            VariableActionRelation,
            Variable,
        ]),
    ],
    controllers: [
        IndicativePlanIndicatorsController,
        ActionPlanIndicatorsController,
        IndicativePlanIndicatorGoalsController,
        IndicativePlanIndicatorQuadrenniumsController,
        ActionPlanIndicatorGoalsController,
        ActionPlanIndicatorQuadrenniumsController,
        VariableIndicativeRelationsController,
        VariableActionRelationsController,
    ],
    providers: [
        IndicativePlanIndicatorsService,
        ActionPlanIndicatorsService,
        IndicativePlanIndicatorGoalsService,
        IndicativePlanIndicatorQuadrenniumsService,
        ActionPlanIndicatorGoalsService,
        ActionPlanIndicatorQuadrenniumsService,
        VariableIndicativeRelationsService,
        VariableActionRelationsService,
    ],
    exports: [
        IndicativePlanIndicatorsService,
        ActionPlanIndicatorsService,
        IndicativePlanIndicatorGoalsService,
        IndicativePlanIndicatorQuadrenniumsService,
        ActionPlanIndicatorGoalsService,
        ActionPlanIndicatorQuadrenniumsService,
        VariableIndicativeRelationsService,
        VariableActionRelationsService,
    ],
})
export class IndicatorsModule { }
