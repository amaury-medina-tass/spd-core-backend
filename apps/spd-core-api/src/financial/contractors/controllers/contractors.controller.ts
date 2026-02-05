import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ContractorsService } from "../services/contractors.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/contractors")
export class ContractorsController {
    constructor(private readonly service: ContractorsService) { }

    @Get()
    @RequirePermission("/financial/master-contracts", "READ")
    @ResponseMessage("Listado de contratistas")
    findAll(@Query("search") search: string) {
        return this.service.findAll(search);
    }
}
