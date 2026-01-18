import { Module } from "@nestjs/common";
import { DetailedActivitiesModule } from "./detailed-activities/detailed-activities.module";
import { RubricsModule } from "./rubrics/rubrics.module";
import { BudgetModificationsModule } from "./budget-modifications/budget-modifications.module";

@Module({
  imports: [DetailedActivitiesModule, RubricsModule, BudgetModificationsModule],
})
export class MastersModule { }
