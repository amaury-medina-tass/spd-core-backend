import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePoaiPpaDto {
    @IsNotEmpty()
    @IsUUID()
    projectId!: string;

    @IsOptional()
    @IsString()
    projectCode?: string;

    @IsNotEmpty()
    @IsInt()
    year!: number;

    @IsOptional()
    @IsNumber()
    projectedPoai?: number;

    @IsOptional()
    @IsNumber()
    assignedPoai?: number;
}
