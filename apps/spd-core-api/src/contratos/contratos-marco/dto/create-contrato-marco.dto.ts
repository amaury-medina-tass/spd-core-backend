import { IsNumber, IsString } from "class-validator";

export class CreateContratoMarcoDto {
  @IsString()
  number!: string;

  @IsString()
  cdp_id!: string;

  @IsNumber()
  consumed_value!: number;
}
