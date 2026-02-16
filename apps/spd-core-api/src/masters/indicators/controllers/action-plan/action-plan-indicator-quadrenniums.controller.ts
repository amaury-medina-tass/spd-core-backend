import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { ActionPlanIndicatorQuadrenniumsService } from "../../services/action-plan/action-plan-indicator-quadrenniums.service";
import { CreateActionPlanIndicatorQuadrenniumDto, UpdateActionPlanIndicatorQuadrenniumDto } from "../../dtos/action-plan/create-action-plan-indicator-quadrennium.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators-quadrenniums")
export class ActionPlanIndicatorQuadrenniumsController {
    constructor(private readonly service: ActionPlanIndicatorQuadrenniumsService) { }

    @Post()
    @RequirePermission("/masters/action-plan-indicators-quadrenniums", "CREATE")
    create(@Body() createDto: CreateActionPlanIndicatorQuadrenniumDto) {
        return this.service.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/action-plan-indicators-quadrenniums", "READ")
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
    @RequirePermission("/masters/action-plan-indicators-quadrenniums", "READ")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/action-plan-indicators-quadrenniums", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateActionPlanIndicatorQuadrenniumDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/action-plan-indicators-quadrenniums", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
