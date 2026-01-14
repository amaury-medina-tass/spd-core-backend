import { IsNumber, IsString } from "class-validator";

export class CreateAdvanceDto {
  @IsString()
  variable_id!: string;

  @IsNumber()
  value!: number;

  @IsString()
  period_type!: string;

  @IsString()
  period_key!: string;
}
