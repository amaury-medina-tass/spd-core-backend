import { IsOptional, IsString, IsUUID } from "class-validator";

export class AssignUserDto {
    @IsUUID()
    userId!: string;

    @IsOptional()
    @IsString()
    userName?: string;
}
