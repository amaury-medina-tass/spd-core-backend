import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VariableAdvance } from "./entities/variable-advance.entity";
import { Variable } from "../../masters/variables/entities/variable.entity";
import { VariableQuadrennium } from "../../masters/variables/entities/variable-quadrennium.entity";
import { VariableAdvancesController } from "./controllers/variable-advances.controller";
import { VariableAdvancesService } from "./services/variable-advances.service";
import { ActionPlanIndicatorGoal } from "../../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { IndicativePlanIndicatorGoal } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { VariableGoal } from "../../masters/variables/entities/variable-goal.entity";
import { VariableActionRelation } from "../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { Formula } from "../../masters/indicators/entities/formula.entity";
import { VariableContextualAccumulator } from "./entities/variable-contextual-accumulator.entity";
import { AstEvaluatorService } from "./services/ast-evaluator.service";
import { IndicatorsModule } from "../../masters/indicators/indicators.module";
import { IndicatorAdvancesModule } from "../indicator-advances/indicator-advances.module";
import { forwardRef } from "@nestjs/common";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            VariableAdvance,
            VariableContextualAccumulator,
            Formula,
            VariableGoal,
            VariableQuadrennium,
            VariableIndicativeRelation,
            VariableActionRelation,
            IndicativePlanIndicatorGoal,
            IndicativePlanIndicatorGoal,
            ActionPlanIndicatorGoal,
            Variable,
        ]),
        IndicatorAdvancesModule,
        forwardRef(() => IndicatorsModule),
    ],
    controllers: [VariableAdvancesController],
    providers: [VariableAdvancesService, AstEvaluatorService],
    exports: [VariableAdvancesService],
})
export class VariableAdvancesModule { }
