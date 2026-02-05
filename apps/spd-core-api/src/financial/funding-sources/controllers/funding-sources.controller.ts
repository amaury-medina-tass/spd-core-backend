import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { FundingSourcesService } from "../services/funding-sources.service";
import { CreateFundingSourceDto } from "../dtos/create-funding-source.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/funding-sources")
export class FundingSourcesController {
    constructor(private readonly service: FundingSourcesService) { }

    @Post()
    @RequirePermission("/financial/projects", "CREATE")
    @ResponseMessage("Fuente de financiación creada exitosamente")
    create(@Body() dto: CreateFundingSourceDto) {
        return this.service.create(dto);
    }

    @Get()
    @RequirePermission("/financial/projects", "READ")
    @ResponseMessage("Listado de fuentes de financiación")
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
    @ResponseMessage("Fuentes de financiación para selector")
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
    @ResponseMessage("Detalle de la fuente de financiación")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/financial/projects", "UPDATE")
    @ResponseMessage("Fuente de financiación actualizada exitosamente")
    update(@Param("id") id: string, @Body() dto: Partial<CreateFundingSourceDto>) {
        return this.service.update(id, dto);
    }

    @Delete(":id")
    @RequirePermission("/financial/projects", "DELETE")
    @ResponseMessage("Fuente de financiación eliminada exitosamente")
    delete(@Param("id") id: string) {
        return this.service.delete(id);
    }
}
