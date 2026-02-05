import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { DependenciesService } from "../services/dependencies.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/dependencies")
export class DependenciesController {
    constructor(private readonly service: DependenciesService) { }

    @Get()
    @RequirePermission("/financial/projects", "READ")
    @ResponseMessage("Listado de dependencias")
    findAll(@Query("search") search: string) {
        return this.service.findAll(search);
    }
}
