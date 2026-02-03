import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndicatorAdvance } from "./entities/indicator-advance.entity";
import { IndicatorAdvancesService } from "./services/indicator-advances.service";
import { IndicativePlanIndicator } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../masters/indicators/entities/action-plan/action-plan-indicator.entity";
import { ActionPlanIndicatorGoal } from "../../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { IndicativePlanIndicatorGoal } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { VariableActionRelation } from "../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { Variable } from "../../masters/variables/entities/variable.entity";
import { VariableGoal } from "../../masters/variables/entities/variable-goal.entity";
import { VariableAdvance } from "../variable-advances/entities/variable-advance.entity";
import { VariableContextualAccumulator } from "../variable-advances/entities/variable-contextual-accumulator.entity";
import { IndicatorAdvancesController } from "./controllers/indicator-advances.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IndicatorAdvance,
            IndicativePlanIndicator,
            ActionPlanIndicator,
            ActionPlanIndicatorGoal,
            IndicativePlanIndicatorGoal,
            VariableActionRelation,
            VariableIndicativeRelation,
            Variable,
            VariableGoal,
            VariableAdvance,
            VariableContextualAccumulator,
        ])
    ],
    controllers: [IndicatorAdvancesController],
    providers: [IndicatorAdvancesService],
    exports: [IndicatorAdvancesService]
})
export class IndicatorAdvancesModule { }

