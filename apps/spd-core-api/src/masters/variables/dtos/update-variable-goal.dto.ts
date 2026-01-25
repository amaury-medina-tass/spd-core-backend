import { IsNumber, IsOptional } from "class-validator";

export class UpdateVariableGoalDto {
    @IsNumber()
    @IsOptional()
    year?: number;

    @IsNumber()
    @IsOptional()
    value?: number;
}
