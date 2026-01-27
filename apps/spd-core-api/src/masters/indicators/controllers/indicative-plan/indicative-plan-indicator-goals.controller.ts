import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { IndicativePlanIndicatorGoalsService } from "../../services/indicative-plan/indicative-plan-indicator-goals.service";
import { CreateIndicativePlanIndicatorGoalDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-goal.dto";
import { UpdateIndicativePlanIndicatorGoalDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-goal.dto";


@Controller("masters/indicative-plan-indicators-goals")
export class IndicativePlanIndicatorGoalsController {
    constructor(private readonly service: IndicativePlanIndicatorGoalsService) { }

    @Post()
    create(@Body() createDto: CreateIndicativePlanIndicatorGoalDto) {
        return this.service.create(createDto);
    }

    @Get()
    findAll(
        @Query("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.service.findAllPaginated(
            indicatorId,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateIndicativePlanIndicatorGoalDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
