import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpService } from "../services/cdp.service";
import { CreateCdpDto } from "../dto/create-cdp.dto";
import { UpdateCdpDto } from "../dto/update-cdp.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financiero/cdp")
export class CdpController {
  constructor(private readonly service: CdpService) {}

  @Post()
  @RequirePermission("financiero.cdp.create")
  @ResponseMessage("CDP creado")
  create(@Body() dto: CreateCdpDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("financiero.cdp.read")
  @ResponseMessage("Listado de CDPs")
  list() {
    return this.service.findAll();
  }

  @Get(":id")
  @RequirePermission("financiero.cdp.read")
  @ResponseMessage("Detalle de CDP")
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @RequirePermission("financiero.cdp.update")
  @ResponseMessage("CDP actualizado")
  update(@Param("id") id: string, @Body() dto: UpdateCdpDto) {
    return this.service.update(id, dto);
  }
}
