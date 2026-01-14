import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateDetailedActivityDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsNumber()
  projectCode!: number;

  @IsOptional()
  @IsNumber()
  cpc?: number;

  @IsOptional()
  @IsNumber()
  balance?: number;
}
