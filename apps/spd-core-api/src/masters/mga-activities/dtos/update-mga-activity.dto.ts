import { IsOptional, IsString } from "class-validator";

export class UpdateMgaActivityDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    observations?: string;

    @IsOptional()
    activityDate?: Date;
}
