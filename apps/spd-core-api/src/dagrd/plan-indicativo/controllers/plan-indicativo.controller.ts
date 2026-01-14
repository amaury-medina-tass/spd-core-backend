import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { PlanIndicativoService } from "../services/plan-indicativo.service";
import { CreatePlanIndicativoDto } from "../dto/create-plan-indicativo.dto";
import { UpdatePlanIndicativoDto } from "../dto/update-plan-indicativo.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("dagrd/plan-indicativo")
export class PlanIndicativoController {
  constructor(private readonly service: PlanIndicativoService) {}

  @Post()
  @RequirePermission("dagrd.plan-indicativo.create")
  @ResponseMessage("Plan indicativo creado")
  create(@Body() dto: CreatePlanIndicativoDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("dagrd.plan-indicativo.read")
  @ResponseMessage("Listado plan indicativo")
  list() {
    return this.service.list();
  }

  @Patch(":id/advance")
  @RequirePermission("dagrd.plan-indicativo.update")
  @ResponseMessage("Avance actualizado")
  updateAdvance(@Param("id") id: string, @Body() dto: UpdatePlanIndicativoDto) {
    return this.service.updateAdvance(id, dto);
  }
}
