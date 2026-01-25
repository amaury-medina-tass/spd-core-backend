import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVariableDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    observations?: string;
}
