import { IsNotEmpty, IsString } from "class-validator";

export class CreateCommuneDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;
}
