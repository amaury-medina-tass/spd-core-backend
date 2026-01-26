import { IsNumber, IsOptional } from "class-validator";

export class UpdateVariableQuadrenniumDto {
    @IsNumber()
    @IsOptional()
    startYear?: number;

    @IsNumber()
    @IsOptional()
    endYear?: number;

    @IsNumber()
    @IsOptional()
    value?: number;
}
