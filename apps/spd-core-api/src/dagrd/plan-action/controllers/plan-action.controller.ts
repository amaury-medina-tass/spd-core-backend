import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { PlanActionService } from "../services/plan-action.service";
import { CreatePlanActionDto } from "../dto/create-plan-action.dto";
import { UpdatePlanActionDto } from "../dto/update-plan-action.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("dagrd/plan-action")
export class PlanActionController {
  constructor(private readonly service: PlanActionService) {}

  @Post()
  @RequirePermission("dagrd.plan-action.create")
  @ResponseMessage("Plan de acción creado")
  create(@Body() dto: CreatePlanActionDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("dagrd.plan-action.read")
  @ResponseMessage("Listado plan de acción")
  list() {
    return this.service.list();
  }

  @Patch(":id/advance")
  @RequirePermission("dagrd.plan-action.update")
  @ResponseMessage("Avance actualizado")
  updateAdvance(@Param("id") id: string, @Body() dto: UpdatePlanActionDto) {
    return this.service.updateAdvance(id, dto);
  }
}
