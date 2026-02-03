import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetIndicatorDetailsDto {
    @Type(() => Number)
    @IsInt()
    year!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    @IsOptional()
    month?: number;
}
