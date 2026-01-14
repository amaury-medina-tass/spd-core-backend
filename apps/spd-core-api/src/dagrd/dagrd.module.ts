import { Module } from "@nestjs/common";
import { PlanActionModule } from "./plan-action/plan-action.module";
import { PlanIndicativoModule } from "./plan-indicativo/plan-indicativo.module";

@Module({
  imports: [PlanActionModule, PlanIndicativoModule],
})
export class DagrdModule {}
