import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VariableAdvancesModule } from "./variable-advances/variable-advances.module";
import { IndicatorAdvancesModule } from "./indicator-advances/indicator-advances.module";
import { SubUserFilterService } from "./services/sub-user-filter.service";
import { SubUserFilterController } from "./controllers/sub-user-filter.controller";
import { IndicativeIndicatorUser } from "../masters/indicators/entities/indicative-plan/indicative-indicator-user.entity";
import { ActionIndicatorUser } from "../masters/indicators/entities/action-plan/action-indicator-user.entity";
import { IndicativePlanIndicator } from "../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../masters/indicators/entities/action-plan/action-plan-indicator.entity";
import { VariableUser } from "../masters/variables/entities/variable-user.entity";
import { Variable } from "../masters/variables/entities/variable.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IndicativeIndicatorUser,
            ActionIndicatorUser,
            IndicativePlanIndicator,
            ActionPlanIndicator,
            VariableUser,
            Variable,
        ]),
        VariableAdvancesModule,
        IndicatorAdvancesModule,
    ],
    controllers: [SubUserFilterController],
    providers: [SubUserFilterService],
    exports: [
        VariableAdvancesModule,
    ],
})
export class SubModule { }
