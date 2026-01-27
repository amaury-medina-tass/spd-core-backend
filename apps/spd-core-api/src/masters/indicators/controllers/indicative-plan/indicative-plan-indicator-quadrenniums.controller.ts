import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe } from "@nestjs/common";
import { IndicativePlanIndicatorQuadrenniumsService } from "../../services/indicative-plan/indicative-plan-indicator-quadrenniums.service";
import { CreateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";
import { UpdateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";

@Controller("masters/indicative-plan-indicators-quadrenniums")
export class IndicativePlanIndicatorQuadrenniumsController {
    constructor(private readonly service: IndicativePlanIndicatorQuadrenniumsService) { }

    @Post()
    create(@Body() createDto: CreateIndicativePlanIndicatorQuadrenniumDto) {
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
        @Body() updateDto: UpdateIndicativePlanIndicatorQuadrenniumDto
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
