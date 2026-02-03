import { IsInt, IsOptional, Max, Min, IsString, ValidateIf } from "class-validator";
import { Type, Transform } from "class-transformer";

export class GetIndicatorDetailsDto {
    @Transform(({ value }) => {
        if (value === 'all' || value === '') return 'all';
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
    @ValidateIf(o => o.year !== 'all')
    @IsInt()
    @IsOptional()
    year?: number | 'all';

    @Transform(({ value }) => {
        if (value === 'all' || value === '') return 'all';
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
    @ValidateIf(o => o.month !== 'all')
    @IsInt()
    @Min(1)
    @Max(12)
    @IsOptional()
    month?: number | 'all';
}
