import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFundingSourceDto {
    @IsNotEmpty()
    @IsString()
    code!: string;

    @IsOptional()
    @IsString()
    name?: string;
}
