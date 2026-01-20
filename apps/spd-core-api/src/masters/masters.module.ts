import { Module } from "@nestjs/common";
import { DetailedActivitiesModule } from "./detailed-activities/detailed-activities.module";
import { RubricsModule } from "./rubrics/rubrics.module";
import { BudgetModificationsModule } from "./budget-modifications/budget-modifications.module";
import { MgaActivitiesModule } from "./mga-activities/mga-activities.module";
import { ProductsModule } from "./products/products.module";

@Module({
  imports: [DetailedActivitiesModule, RubricsModule, BudgetModificationsModule, MgaActivitiesModule, ProductsModule],
})
export class MastersModule { }
