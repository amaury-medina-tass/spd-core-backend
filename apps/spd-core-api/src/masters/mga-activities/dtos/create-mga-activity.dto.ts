import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateMgaActivityDto {
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

    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsUUID()
    @IsOptional()
    productId?: string;

    @IsArray()
    @IsUUID("4", { each: true })
    @IsOptional()
    detailedActivityIds?: string[];
}
