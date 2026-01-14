import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { VariablesService } from "../services/variables.service";
import { CreateVariableDto } from "../dto/create-variable.dto";
import { UpdateVariableDto } from "../dto/update-variable.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/variables")
export class VariablesController {
  constructor(private readonly service: VariablesService) {}

  @Post()
  @RequirePermission("masters.variables.create")
  @ResponseMessage("Variable creada")
  create(@Body() dto: CreateVariableDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("masters.variables.read")
  @ResponseMessage("Listado de variables")
  list() {
    return this.service.findAll();
  }

  @Get(":id")
  @RequirePermission("masters.variables.read")
  @ResponseMessage("Detalle de variable")
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @RequirePermission("masters.variables.update")
  @ResponseMessage("Variable actualizada")
  update(@Param("id") id: string, @Body() dto: UpdateVariableDto) {
    return this.service.update(id, dto);
  }
}
