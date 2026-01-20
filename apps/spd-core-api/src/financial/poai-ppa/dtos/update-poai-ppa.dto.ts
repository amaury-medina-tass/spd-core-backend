import { PartialType } from "@nestjs/mapped-types";
import { CreatePoaiPpaDto } from "./create-poai-ppa.dto";

export class UpdatePoaiPpaDto extends PartialType(CreatePoaiPpaDto) { }
