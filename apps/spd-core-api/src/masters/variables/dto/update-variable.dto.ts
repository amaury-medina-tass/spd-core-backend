import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateVariableDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value_type?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
