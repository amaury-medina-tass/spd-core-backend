import { PartialType } from "@nestjs/mapped-types";
import { CreateMgaActivityDto } from "./create-mga-activity.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateMgaActivityDto extends PartialType(CreateMgaActivityDto) {}
