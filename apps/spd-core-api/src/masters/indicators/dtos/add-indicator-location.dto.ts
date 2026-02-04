import { IsNotEmpty, IsUUID } from "class-validator";

export class AddIndicatorLocationDto {
    @IsUUID()
    @IsNotEmpty()
    locationId!: string;
}
