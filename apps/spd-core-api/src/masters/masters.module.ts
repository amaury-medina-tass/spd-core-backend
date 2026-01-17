import { Module } from "@nestjs/common";


import { VariablesModule } from "./variables/variables.module";

import { DetailedActivitiesModule } from "./activities/detailed-activities/detailed-activities.module";
import { MgaActivitiesModule } from "./activities/mga-activities/mga-activities.module";
import { ActionPlanIndicatorsModule } from "./indicators/action-plan-indicators/action-plan-indicators.module";
import { IndicativePlanIndicatorsModule } from "./indicators/indicative-plan-indicators/indicative-plan-indicators.module";
import { PreviousStudiesModule } from "./previous-studies/previous-studies.module";

@Module({
  imports: [
    VariablesModule,
    DetailedActivitiesModule,
    MgaActivitiesModule,
    ActionPlanIndicatorsModule,
    IndicativePlanIndicatorsModule,
    PreviousStudiesModule,
  ],
})
export class MastersModule { }
