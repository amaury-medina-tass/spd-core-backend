import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMgaActivityDto {
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
  productCode?: number;
}
