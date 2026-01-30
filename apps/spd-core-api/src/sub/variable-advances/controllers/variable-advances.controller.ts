import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
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
        @Query("year") year?: number
    ) {
        return this.variableAdvancesService.findAllByActionIndicator(indicatorId, year);
    }

    @Get("contextual/indicative-indicator/:indicatorId")
    findAllByIndicativeIndicator(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("year") year?: number
    ) {
        return this.variableAdvancesService.findAllByIndicativeIndicator(indicatorId, year);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.variableAdvancesService.findOne(id);
    }
}
