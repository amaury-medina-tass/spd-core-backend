import { Body, Controller, Delete, Get, Param, Post, ParseUUIDPipe } from "@nestjs/common";
import { IndicatorLocationsService } from "../../services/indicator-locations.service";
import { AddIndicatorLocationDto } from "../../dtos/add-indicator-location.dto";

@Controller("masters/action-plan-indicators/:indicatorId/locations")
export class ActionPlanIndicatorLocationsController {
    constructor(private readonly indicatorLocationsService: IndicatorLocationsService) { }

    @Post()
    addLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Body() dto: AddIndicatorLocationDto
    ) {
        return this.indicatorLocationsService.addLocationToActionIndicator(indicatorId, dto.locationId);
    }

    @Get()
    findAll(@Param("indicatorId", ParseUUIDPipe) indicatorId: string) {
        return this.indicatorLocationsService.findByActionIndicator(indicatorId);
    }

    @Delete(":locationId")
    removeLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Param("locationId", ParseUUIDPipe) locationId: string
    ) {
        return this.indicatorLocationsService.removeLocationFromActionIndicator(indicatorId, locationId);
    }
}
