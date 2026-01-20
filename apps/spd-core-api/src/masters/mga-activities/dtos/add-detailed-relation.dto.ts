import { IsNotEmpty, IsUUID } from "class-validator";

export class AddDetailedRelationDto {
    @IsUUID()
    @IsNotEmpty()
    detailedActivityId!: string;
}
