import { IsUUID } from "class-validator";

export class AssignVariableUserDto {
    @IsUUID()
    userId!: string;
}
