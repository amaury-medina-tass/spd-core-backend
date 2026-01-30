import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndicatorAdvance } from "./entities/indicator-advance.entity";
import { IndicatorAdvancesService } from "./services/indicator-advances.service";
import { IndicativePlanIndicator } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../masters/indicators/entities/action-plan/action-plan-indicator.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IndicatorAdvance,
            IndicativePlanIndicator,
            ActionPlanIndicator,
        ])
    ],
    providers: [IndicatorAdvancesService],
    exports: [IndicatorAdvancesService]
})
export class IndicatorAdvancesModule { }
