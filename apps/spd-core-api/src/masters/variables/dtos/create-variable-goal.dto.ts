import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class CreateVariableGoalDto {
    @IsUUID()
    @IsNotEmpty()
    variableId!: string;

    @IsNumber()
    @IsNotEmpty()
    year!: number;

    @IsNumber()
    @IsNotEmpty()
    value!: number;
}
