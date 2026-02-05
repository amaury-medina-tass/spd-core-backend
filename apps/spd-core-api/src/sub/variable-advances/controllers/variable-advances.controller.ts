import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { VariableAdvancesService } from "../services/variable-advances.service";
import { CreateVariableAdvanceDto } from "../dtos/create-variable-advance.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sub/variable-advances")
export class VariableAdvancesController {
    constructor(private readonly variableAdvancesService: VariableAdvancesService) { }

    @Post()
    @RequirePermission("/sub/variables", "CREATE")
    create(@Body() createDto: CreateVariableAdvanceDto) {
        return this.variableAdvancesService.create(createDto);
    }


    @Get()
    @RequirePermission("/sub/variables", "READ")
    findAll(
        @Query("variableId", ParseUUIDPipe) variableId: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.variableAdvancesService.findAllPaginated(
            variableId,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get("contextual/action-indicator/:indicatorId")
    @RequirePermission("/sub/variables", "READ")
    findAllByActionIndicator(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("year") year?: number,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string
    ) {
        return this.variableAdvancesService.findAllByActionIndicator(
            indicatorId,
            year,
            page ? +page : 1,
            limit ? +limit : 10,
            search
        );
    }

    @Get("contextual/indicative-indicator/:indicatorId")
    @RequirePermission("/sub/variables", "READ")
    findAllByIndicativeIndicator(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("year") year?: number,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string
    ) {
        return this.variableAdvancesService.findAllByIndicativeIndicator(
            indicatorId,
            year,
            page ? +page : 1,
            limit ? +limit : 10,
            search
        );
    }

    @Get(":id")
    @RequirePermission("/sub/variables", "READ")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.variableAdvancesService.findOne(id);
    }

    @Get(":id/details")
    @RequirePermission("/sub/variables", "READ")
    async getDetails(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("year") year?: string,
        @Query("month") month?: string
    ) {
        const parsedYear = year && year.toString().toLowerCase() === "all" ? undefined : (year ? Number(year) : undefined);
        const parsedMonth = month && month.toString().toLowerCase() === "all" ? undefined : (month ? Number(month) : undefined);
        
        if (parsedYear && isNaN(parsedYear)) throw new BadRequestException("Invalid year");
        if (parsedMonth && isNaN(parsedMonth)) throw new BadRequestException("Invalid month");

        return this.variableAdvancesService.getVariableDetails(id, parsedYear, parsedMonth);
    }
}
