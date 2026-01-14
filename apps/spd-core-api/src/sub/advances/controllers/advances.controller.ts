import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { AdvancesService } from "../services/advances.service";
import { CreateAdvanceDto } from "../dto/create-advance.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sub/advances")
export class AdvancesController {
  constructor(private readonly service: AdvancesService) {}

  @Post()
  @RequirePermission("sub.advances.create")
  @ResponseMessage("Avance registrado")
  create(@Body() dto: CreateAdvanceDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("sub.advances.read")
  @ResponseMessage("Listado de avances")
  list() {
    return this.service.list();
  }
}
