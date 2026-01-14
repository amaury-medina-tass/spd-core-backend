import { IsNumber, IsString } from "class-validator";

export class CreatePlanIndicativoDto {
  @IsString()
  activity_id!: string;

  @IsString()
  component!: string;

  @IsNumber()
  target!: number;
}
