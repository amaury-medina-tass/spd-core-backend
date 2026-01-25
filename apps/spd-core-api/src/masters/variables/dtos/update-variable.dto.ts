import { IsOptional, IsString } from "class-validator";

export class UpdateVariableDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    observations?: string;
}
