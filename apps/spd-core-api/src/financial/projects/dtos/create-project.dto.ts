import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    code!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    dependencyId!: string;

    @IsOptional()
    @IsNumber()
    initialBudget?: number;

    @IsOptional()
    @IsNumber()
    currentBudget?: number;

    @IsOptional()
    @IsNumber()
    execution?: number;

    @IsOptional()
    @IsNumber()
    commitment?: number;

    @IsOptional()
    @IsNumber()
    payments?: number;

    @IsOptional()
    @IsNumber()
    invoiced?: number;

    @IsOptional()
    @IsString()
    origin?: string;
}
