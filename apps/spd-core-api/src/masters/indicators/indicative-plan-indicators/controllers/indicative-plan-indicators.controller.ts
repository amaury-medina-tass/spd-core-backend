import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../../common/decorators/response-message.decorator";
import { IndicativePlanIndicatorsService } from "../services/indicative-plan-indicators.service";
import { CreateIndicativePlanIndicatorDto } from "../dto/create-indicative-plan-indicator.dto";
import { UpdateIndicativePlanIndicatorDto } from "../dto/update-indicative-plan-indicator.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicative-plan-indicators")
export class IndicativePlanIndicatorsController {
  constructor(private readonly service: IndicativePlanIndicatorsService) {}

  @Post()
  @RequirePermission("masters.indicators.create")
  @ResponseMessage("Indicador Plan Indicativo creado")
  create(@Body() dto: CreateIndicativePlanIndicatorDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("masters.indicators.read")
  @ResponseMessage("Listado indicadores Plan Indicativo")
  findAll() {
    return this.service.findAll();
  }

  @Patch(":id")
  @RequirePermission("masters.indicators.update")
  @ResponseMessage("Indicador Plan Indicativo actualizado")
  update(@Param("id") id: string, @Body() dto: UpdateIndicativePlanIndicatorDto) {
    return this.service.update(id, dto);
  }
}
