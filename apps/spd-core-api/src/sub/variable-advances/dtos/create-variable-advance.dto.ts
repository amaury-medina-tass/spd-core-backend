import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, IsArray } from "class-validator";

export class CreateVariableAdvanceDto {
    @IsUUID()
    @IsNotEmpty()
    variableId!: string;

    @IsNumber()
    @IsNotEmpty()
    year!: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(12)
    month!: number;

    @IsNumber()
    @IsNotEmpty()
    value!: number;

    @IsString()
    @IsOptional()
    observations?: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    communeIds?: string[];
}
