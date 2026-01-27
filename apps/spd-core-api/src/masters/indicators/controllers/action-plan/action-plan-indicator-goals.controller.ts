import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { ActionPlanIndicatorGoalsService } from "../../services/action-plan/action-plan-indicator-goals.service";
import { CreateActionPlanIndicatorGoalDto } from "../../dtos/action-plan/create-action-plan-indicator-goal.dto";
import { UpdateActionPlanIndicatorGoalDto } from "../../dtos/action-plan/create-action-plan-indicator-goal.dto";


@Controller("masters/action-plan-indicators-goals")
export class ActionPlanIndicatorGoalsController {
    constructor(private readonly service: ActionPlanIndicatorGoalsService) { }

    @Post()
    create(@Body() createDto: CreateActionPlanIndicatorGoalDto) {
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
        @Body() updateDto: UpdateActionPlanIndicatorGoalDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
