import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ProjectsService } from "../services/projects.service";
import { CreateProjectDto } from "../dtos/create-project.dto";
import { BaseReadPaginatedSelectController } from "../../../shared/controllers";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission("/financial/projects", "READ")
@Controller("financial/projects")
export class ProjectsController extends BaseReadPaginatedSelectController {
    protected readonly service: ProjectsService;
    protected readonly entityLabel = "Proyectos";

    constructor(service: ProjectsService) {
        super();
        this.service = service;
    }

    @Post()
    @RequirePermission("/financial/projects", "CREATE")
    @ResponseMessage("Proyecto creado exitosamente")
    create(@Body() dto: CreateProjectDto) {
        return this.service.create(dto);
    }
}
