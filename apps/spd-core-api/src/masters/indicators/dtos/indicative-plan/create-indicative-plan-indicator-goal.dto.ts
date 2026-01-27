import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateIndicativePlanIndicatorGoalDto {
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

export class UpdateIndicativePlanIndicatorGoalDto {
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
