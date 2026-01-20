import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { PoaiPpaService } from "../services/poai-ppa.service";
import { CreatePoaiPpaDto } from "../dtos/create-poai-ppa.dto";
import { UpdatePoaiPpaDto } from "../dtos/update-poai-ppa.dto";

@UseGuards(JwtAuthGuard)
@Controller("financial/poai-ppa")
export class PoaiPpaController {
    constructor(private readonly service: PoaiPpaService) { }

    @Post()
    @ResponseMessage("Registro POAI PPA creado exitosamente")
    create(@Body() dto: CreatePoaiPpaDto) {
        return this.service.create(dto);
    }

    @Get()
    @ResponseMessage("Listado de registros POAI PPA")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
        @Query("year") year: number,
        @Query("projectId") projectId: string
    ) {
        return this.service.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
            year ? +year : undefined,
            projectId
        );
    }

    @Get("trends")
    @ResponseMessage("Tendencias anuales de POAI PPA")
    getYearlyTrends(
        @Query("startYear") startYear: number,
        @Query("endYear") endYear: number
    ) {
        return this.service.getYearlyTrends(
            startYear ? +startYear : undefined,
            endYear ? +endYear : undefined
        );
    }

    @Get("project/:projectId/years")
    @ResponseMessage("Comparativa de años del proyecto")
    findYearComparisonByProject(@Param("projectId") projectId: string) {
        return this.service.findYearComparisonByProject(projectId);
    }

    @Get("project/:projectId/summary")
    @ResponseMessage("Resumen presupuestal del proyecto")
    getBudgetSummaryByProject(@Param("projectId") projectId: string) {
        return this.service.getBudgetSummaryByProject(projectId);
    }

    @Get("project/:projectId/evolution")
    @ResponseMessage("Evolución presupuestal del proyecto")
    getProjectBudgetEvolution(@Param("projectId") projectId: string) {
        return this.service.getProjectBudgetEvolution(projectId);
    }

    @Get("project/:projectId/year/:year")
    @ResponseMessage("Registro POAI PPA por proyecto y año")
    findByProjectAndYear(
        @Param("projectId") projectId: string,
        @Param("year") year: number
    ) {
        return this.service.findByProjectAndYear(projectId, +year);
    }

    @Get(":id")
    @ResponseMessage("Detalle del registro POAI PPA")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @ResponseMessage("Registro POAI PPA actualizado exitosamente")
    update(@Param("id") id: string, @Body() dto: UpdatePoaiPpaDto) {
        return this.service.update(id, dto);
    }

    @Delete(":id")
    @ResponseMessage("Registro POAI PPA eliminado exitosamente")
    remove(@Param("id") id: string) {
        return this.service.remove(id);
    }
}
