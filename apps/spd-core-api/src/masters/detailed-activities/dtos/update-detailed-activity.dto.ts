import { IsOptional, IsString } from "class-validator";

export class UpdateDetailedActivityDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    observations?: string;
}
