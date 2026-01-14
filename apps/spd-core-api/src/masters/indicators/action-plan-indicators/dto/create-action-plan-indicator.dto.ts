import { IsArray, IsObject, IsOptional, IsString } from "class-validator";

export class CreateActionPlanIndicatorDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  formula_ast!: Record<string, any>;

  @IsArray()
  variable_ids!: string[];
}
