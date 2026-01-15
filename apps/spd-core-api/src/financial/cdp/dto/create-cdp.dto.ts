import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCdpDto {
  @IsString()
  @MaxLength(120)
  number!: string;

  @IsString()
  activity_id!: string;

  @IsNumber()
  value!: number;

  @IsOptional()
  @IsNumber()
  activity_delta?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
