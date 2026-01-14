import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../../common/decorators/response-message.decorator";
import { ActionPlanIndicatorsService } from "../services/action-plan-indicators.service";
import { CreateActionPlanIndicatorDto } from "../dto/create-action-plan-indicator.dto";
import { UpdateActionPlanIndicatorDto } from "../dto/update-action-plan-indicator.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ActionPlanIndicatorsController {
  constructor(private readonly service: ActionPlanIndicatorsService) {}

  @Post()
  @RequirePermission("masters.indicators.create")
  @ResponseMessage("Indicador Plan Acción creado")
  create(@Body() dto: CreateActionPlanIndicatorDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("masters.indicators.read")
  @ResponseMessage("Listado indicadores Plan Acción")
  findAll() {
    return this.service.findAll();
  }

  @Patch(":id")
  @RequirePermission("masters.indicators.update")
  @ResponseMessage("Indicador Plan Acción actualizado")
  update(@Param("id") id: string, @Body() dto: UpdateActionPlanIndicatorDto) {
    return this.service.update(id, dto);
  }
}
