import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { VariableAdvancesService } from "../services/variable-advances.service";
import { CreateVariableAdvanceDto } from "../dtos/create-variable-advance.dto";

@Controller("sub/variable-advances")
export class VariableAdvancesController {
    constructor(private readonly variableAdvancesService: VariableAdvancesService) { }

    @Post()
    create(@Body() createDto: CreateVariableAdvanceDto) {
        return this.variableAdvancesService.create(createDto);
    }


    @Get()
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
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.variableAdvancesService.findOne(id);
    }

    @Get(":id/details")
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
