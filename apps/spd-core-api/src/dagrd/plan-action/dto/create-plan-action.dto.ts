import { IsNumber, IsString } from "class-validator";

export class CreatePlanActionDto {
  @IsString()
  activity_id!: string;

  @IsString()
  line!: string;

  @IsNumber()
  target!: number;
}
