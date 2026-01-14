import { PartialType } from "@nestjs/mapped-types";
import { CreateDetailedActivityDto } from "./create-detailed-activity.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateDetailedActivityDto extends PartialType(CreateDetailedActivityDto) {}
