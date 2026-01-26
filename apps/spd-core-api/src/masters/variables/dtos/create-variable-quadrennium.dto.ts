import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class CreateVariableQuadrenniumDto {
    @IsUUID()
    @IsNotEmpty()
    variableId!: string;

    @IsNumber()
    @IsNotEmpty()
    startYear!: number;

    @IsNumber()
    @IsNotEmpty()
    endYear!: number;

    @IsNumber()
    @IsNotEmpty()
    value!: number;
}
