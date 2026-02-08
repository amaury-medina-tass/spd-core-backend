import { IsOptional, IsString, IsUUID } from "class-validator";

export class AssignVariableUserDto {
    @IsUUID()
    userId!: string;

    @IsOptional()
    @IsString()
    userName?: string;
}
