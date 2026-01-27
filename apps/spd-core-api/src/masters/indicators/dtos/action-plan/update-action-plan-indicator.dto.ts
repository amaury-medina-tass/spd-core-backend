import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateActionPlanIndicatorDto {
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

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    plannedQuantity?: number;

    @IsOptional()
    @IsString()
    executionCut?: string;

    @IsOptional()
    @IsNumber()
    compliancePercentage?: number;

    @IsOptional()
    @IsString()
    observations?: string;

    @IsOptional()
    @IsNumber()
    unitMeasureId?: number;
}
