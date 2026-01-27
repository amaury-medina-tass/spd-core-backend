import { IsNotEmpty, IsString, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateFormulaDto {
  @IsString()
  @IsNotEmpty()
  expression: string;

  @IsObject()
  @IsNotEmpty()
  ast: any;

  @IsUUID()
  @IsOptional()
  indicativeIndicatorId?: string;

  @IsUUID()
  @IsOptional()
  actionIndicatorId?: string;
}
