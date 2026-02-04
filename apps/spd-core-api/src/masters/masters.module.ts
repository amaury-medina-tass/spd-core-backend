import { Module } from "@nestjs/common";
import { DetailedActivitiesModule } from "./detailed-activities/detailed-activities.module";
import { RubricsModule } from "./rubrics/rubrics.module";
import { BudgetModificationsModule } from "./budget-modifications/budget-modifications.module";
import { MgaActivitiesModule } from "./mga-activities/mga-activities.module";
import { ProductsModule } from "./products/products.module";
import { VariablesModule } from "./variables/variables.module";
import { IndicatorsModule } from "./indicators/indicators.module";
import { LocationsModule } from "./locations/locations.module";

@Module({
  imports: [DetailedActivitiesModule, RubricsModule, BudgetModificationsModule, MgaActivitiesModule, ProductsModule, VariablesModule, IndicatorsModule, LocationsModule],
})
export class MastersModule { }

