import { IsNotEmpty, IsOptional, IsUUID, ValidateIf } from "class-validator";

export class CreateIndicatorLocationDto {
    @IsUUID()
    @IsOptional()
    @ValidateIf(o => !o.actionIndicatorId)
    indicativeIndicatorId?: string;

    @IsUUID()
    @IsOptional()
    @ValidateIf(o => !o.indicativeIndicatorId)
    actionIndicatorId?: string;

    @IsUUID()
    @IsNotEmpty()
    locationId!: string;
}
