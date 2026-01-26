import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ActionPlanIndicatorsService } from "../services/action-plan-indicators.service";
import { CreateActionPlanIndicatorDto } from "../dtos/create-action-plan-indicator.dto";
import { UpdateActionPlanIndicatorDto } from "../dtos/update-action-plan-indicator.dto";

@Controller("masters/action-plan-indicators")
export class ActionPlanIndicatorsController {
    constructor(private readonly actionPlanIndicatorsService: ActionPlanIndicatorsService) { }

    @Post()
    create(@Body() createDto: CreateActionPlanIndicatorDto) {
        return this.actionPlanIndicatorsService.create(createDto);
    }

    @Get()
    findAll(
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 10,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("sortOrder") sortOrder?: "ASC" | "DESC"
    ) {
        return this.actionPlanIndicatorsService.findAllPaginated(page, limit, search, sortBy, sortOrder);
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.actionPlanIndicatorsService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() updateDto: UpdateActionPlanIndicatorDto) {
        return this.actionPlanIndicatorsService.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.actionPlanIndicatorsService.remove(id);
    }
}
