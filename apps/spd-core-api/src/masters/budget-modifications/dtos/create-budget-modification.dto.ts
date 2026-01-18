import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsDateString } from "class-validator";
import { ModificationType } from "../entities/budget-modification.entity";

export class CreateBudgetModificationDto {
    @IsEnum(ModificationType)
    @IsNotEmpty()
    modificationType!: ModificationType;

    @IsString()
    @IsOptional()
    legalDocument?: string;

    @IsDateString()
    @IsOptional()
    dateIssue?: Date;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsUUID()
    @IsNotEmpty()
    detailedActivityId!: string;

    @IsUUID()
    @IsUUID()
    @IsOptional()
    newRubricId?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
