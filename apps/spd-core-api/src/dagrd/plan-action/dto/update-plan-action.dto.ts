import { IsNumber } from "class-validator";

export class UpdatePlanActionDto {
  @IsNumber()
  advance!: number;
}
