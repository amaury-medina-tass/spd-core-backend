import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateActionPlanIndicatorDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    statisticalCode?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    sequenceNumber?: number;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsOptional()
    @IsNumber()
    plannedQuantity?: number;

    @IsOptional()
    @IsString()
    executionCut?: string;

    @IsOptional()
    @IsNumber()
    compliancePercentage?: number;

    @IsNotEmpty()
    @IsString()
    observations!: string;

    @IsOptional()
    @IsNumber()
    unitMeasureId?: number;
}
