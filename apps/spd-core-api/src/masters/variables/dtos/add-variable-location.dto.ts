import { IsNotEmpty, IsUUID } from "class-validator";

export class AddVariableLocationDto {
    @IsUUID()
    @IsNotEmpty()
    locationId!: string;
}
