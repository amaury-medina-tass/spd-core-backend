import { PartialType } from "@nestjs/mapped-types";
import { CreateIndicativePlanIndicatorDto } from "./create-indicative-plan-indicator.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateIndicativePlanIndicatorDto extends PartialType(CreateIndicativePlanIndicatorDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
