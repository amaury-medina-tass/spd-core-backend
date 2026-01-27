import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateActionPlanIndicatorQuadrenniumDto {
    @IsNotEmpty()
    @IsUUID()
    indicatorId!: string;

    @IsNotEmpty()
    @IsNumber()
    startYear!: number;

    @IsNotEmpty()
    @IsNumber()
    endYear!: number;

    @IsNotEmpty()
    @IsNumber()
    value!: number;
}

export class UpdateActionPlanIndicatorQuadrenniumDto {
    @IsOptional()
    @IsUUID()
    indicatorId?: string;

    @IsOptional()
    @IsNumber()
    startYear?: number;

    @IsOptional()
    @IsNumber()
    endYear?: number;

    @IsOptional()
    @IsNumber()
    value?: number;
}
