import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateActionPlanIndicatorGoalDto {
    @IsNotEmpty()
    @IsUUID()
    indicatorId!: string;

    @IsNotEmpty()
    @IsNumber()
    year!: number;

    @IsNotEmpty()
    @IsNumber()
    value!: number;
}

export class UpdateActionPlanIndicatorGoalDto {
    @IsOptional()
    @IsUUID()
    indicatorId?: string;

    @IsOptional()
    @IsNumber()
    year?: number;

    @IsOptional()
    @IsNumber()
    value?: number;
}
