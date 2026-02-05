import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ActionPlanIndicatorsService } from "../../services/action-plan/action-plan-indicators.service";
import { CreateActionPlanIndicatorDto } from "../../dtos/action-plan/create-action-plan-indicator.dto";
import { UpdateActionPlanIndicatorDto } from "../../dtos/action-plan/update-action-plan-indicator.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ActionPlanIndicatorsController {
    constructor(private readonly actionPlanIndicatorsService: ActionPlanIndicatorsService) { }

    @Post()
    @RequirePermission("/masters/indicators", "CREATE")
    create(@Body() createDto: CreateActionPlanIndicatorDto) {
        return this.actionPlanIndicatorsService.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/indicators", "READ")
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
    @RequirePermission("/masters/indicators", "READ")
    findOne(@Param("id") id: string) {
        return this.actionPlanIndicatorsService.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/indicators", "UPDATE")
    update(@Param("id") id: string, @Body() updateDto: UpdateActionPlanIndicatorDto) {
        return this.actionPlanIndicatorsService.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/indicators", "DELETE")
    remove(@Param("id") id: string) {
        return this.actionPlanIndicatorsService.remove(id);
    }
}
