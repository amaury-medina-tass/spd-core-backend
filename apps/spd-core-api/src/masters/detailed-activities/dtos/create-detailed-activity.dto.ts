import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDetailedActivityDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    observations?: string;

    @IsOptional()
    activityDate?: Date;

    @IsNumber()
    @IsOptional()
    budgetCeiling?: number;

    @IsNumber()
    @IsOptional()
    balance?: number;

    @IsNumber()
    @IsOptional()
    cpc?: number;

    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsUUID()
    @IsOptional()
    rubricId?: string;
}
