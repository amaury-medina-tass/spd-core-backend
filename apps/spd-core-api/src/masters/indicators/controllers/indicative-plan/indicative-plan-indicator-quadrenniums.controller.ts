import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { IndicativePlanIndicatorQuadrenniumsService } from "../../services/indicative-plan/indicative-plan-indicator-quadrenniums.service";
import { CreateIndicativePlanIndicatorQuadrenniumDto, UpdateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicative-plan-indicators-quadrenniums")
export class IndicativePlanIndicatorQuadrenniumsController {
    constructor(private readonly service: IndicativePlanIndicatorQuadrenniumsService) { }

    @Post()
    @RequirePermission("/masters/indicative-plan-indicators-quadrenniums", "CREATE")
    create(@Body() createDto: CreateIndicativePlanIndicatorQuadrenniumDto) {
        return this.service.create(createDto);
    }

    @Get("by-indicator/:indicatorId")
    @RequirePermission("/masters/indicative-plan-indicators-quadrenniums", "READ")
    findAllByIndicator(@Param("indicatorId", ParseUUIDPipe) indicatorId: string) {
        return this.service.findAllByParent(indicatorId);
    }

    @Get(":id")
    @RequirePermission("/masters/indicative-plan-indicators-quadrenniums", "READ")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/indicative-plan-indicators-quadrenniums", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateIndicativePlanIndicatorQuadrenniumDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/indicative-plan-indicators-quadrenniums", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
