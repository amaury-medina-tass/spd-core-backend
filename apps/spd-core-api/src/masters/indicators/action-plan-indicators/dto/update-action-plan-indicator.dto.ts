import { PartialType } from "@nestjs/mapped-types";
import { CreateActionPlanIndicatorDto } from "./create-action-plan-indicator.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateActionPlanIndicatorDto extends PartialType(CreateActionPlanIndicatorDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
