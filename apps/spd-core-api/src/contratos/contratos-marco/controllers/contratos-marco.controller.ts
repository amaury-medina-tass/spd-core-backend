import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ContratosMarcoService } from "../services/contratos-marco.service";
import { CreateContratoMarcoDto } from "../dto/create-contrato-marco.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("contratos/contratos-marco")
export class ContratosMarcoController {
  constructor(private readonly service: ContratosMarcoService) {}

  @Post()
  @RequirePermission("contratos.marco.create")
  @ResponseMessage("Contrato marco creado")
  create(@Body() dto: CreateContratoMarcoDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("contratos.marco.read")
  @ResponseMessage("Listado contratos marco")
  list() {
    return this.service.list();
  }
}
