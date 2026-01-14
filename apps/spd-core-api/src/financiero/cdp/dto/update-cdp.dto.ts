import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateCdpDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  activity_delta?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
