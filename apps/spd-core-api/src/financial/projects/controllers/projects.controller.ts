import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ProjectsService } from "../services/projects.service";
import { CreateProjectDto } from "../dtos/create-project.dto";

@UseGuards(JwtAuthGuard)
@Controller("financial/projects")
export class ProjectsController {
    constructor(private readonly service: ProjectsService) { }

    @Post()
    @ResponseMessage("Proyecto creado exitosamente")
    create(@Body() dto: CreateProjectDto) {
        return this.service.create(dto);
    }

    @Get()
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

    @Get(":id")
    @ResponseMessage("Detalle del proyecto")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
