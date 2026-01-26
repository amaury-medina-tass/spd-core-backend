import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateIndicativePlanIndicatorDto {
    @IsOptional()
    @IsString()
    pillarCode?: string;

    @IsOptional()
    @IsString()
    pillarName?: string;

    @IsOptional()
    @IsString()
    componentCode?: string;

    @IsOptional()
    @IsString()
    componentName?: string;

    @IsOptional()
    @IsString()
    programCode?: string;

    @IsOptional()
    @IsString()
    programName?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    baseline?: string;

    @IsNotEmpty()
    @IsString()
    observations!: string;

    @IsOptional()
    @IsNumber()
    advancePercentage?: number;

    @IsOptional()
    @IsNumber()
    indicatorTypeId?: number;

    @IsOptional()
    @IsNumber()
    unitMeasureId?: number;

    @IsOptional()
    @IsNumber()
    directionId?: number;
}
