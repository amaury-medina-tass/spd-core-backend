import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { IndicativePlanIndicatorGoalsService } from "../../services/indicative-plan/indicative-plan-indicator-goals.service";
import { CreateIndicativePlanIndicatorGoalDto, UpdateIndicativePlanIndicatorGoalDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-goal.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";


@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicative-plan-indicators-goals")
export class IndicativePlanIndicatorGoalsController {
    constructor(private readonly service: IndicativePlanIndicatorGoalsService) { }

    @Post()
    @RequirePermission("/masters/indicative-plan-indicators-goals", "CREATE")
    create(@Body() createDto: CreateIndicativePlanIndicatorGoalDto) {
        return this.service.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/indicative-plan-indicators-goals", "READ")
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
    @RequirePermission("/masters/indicative-plan-indicators-goals", "READ")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/indicative-plan-indicators-goals", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateIndicativePlanIndicatorGoalDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/indicative-plan-indicators-goals", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
