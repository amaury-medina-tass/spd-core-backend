import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe } from "@nestjs/common";
import { ActionPlanIndicatorQuadrenniumsService } from "../../services/action-plan/action-plan-indicator-quadrenniums.service";
import { CreateActionPlanIndicatorQuadrenniumDto } from "../../dtos/action-plan/create-action-plan-indicator-quadrennium.dto";
import { UpdateActionPlanIndicatorQuadrenniumDto } from "../../dtos/action-plan/create-action-plan-indicator-quadrennium.dto";

@Controller("masters/action-plan-indicators-quadrenniums")
export class ActionPlanIndicatorQuadrenniumsController {
    constructor(private readonly service: ActionPlanIndicatorQuadrenniumsService) { }

    @Post()
    create(@Body() createDto: CreateActionPlanIndicatorQuadrenniumDto) {
        return this.service.create(createDto);
    }

    @Get("by-indicator/:indicatorId")
    findAllByIndicator(@Param("indicatorId", ParseUUIDPipe) indicatorId: string) {
        return this.service.findAllByIndicator(indicatorId);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateActionPlanIndicatorQuadrenniumDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
