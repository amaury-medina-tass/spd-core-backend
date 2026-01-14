import { IsNumber } from "class-validator";

export class UpdatePlanIndicativoDto {
  @IsNumber()
  advance!: number;
}
