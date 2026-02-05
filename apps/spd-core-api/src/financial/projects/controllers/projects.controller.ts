import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ProjectsService } from "../services/projects.service";
import { CreateProjectDto } from "../dtos/create-project.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/projects")
export class ProjectsController {
    constructor(private readonly service: ProjectsService) { }

    @Post()
    @RequirePermission("/financial/projects", "CREATE")
    @ResponseMessage("Proyecto creado exitosamente")
    create(@Body() dto: CreateProjectDto) {
        return this.service.create(dto);
    }

    @Get()
    @RequirePermission("/financial/projects", "READ")
    @ResponseMessage("Listado de proyectos")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.service.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get("select")
    @RequirePermission("/financial/projects", "READ")
    @ResponseMessage("Proyectos para selector")
    findForSelect(
        @Query("search") search: string,
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ) {
        return this.service.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }

    @Get(":id")
    @RequirePermission("/financial/projects", "READ")
    @ResponseMessage("Detalle del proyecto")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
