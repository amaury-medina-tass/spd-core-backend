import { Body, Controller, Delete, Get, Param, Post, ParseUUIDPipe } from "@nestjs/common";
import { VariableLocationsService } from "../services/variable-locations.service";
import { AddVariableLocationDto } from "../dtos/add-variable-location.dto";

@Controller("masters/variables/:variableId/locations")
export class VariableLocationsController {
    constructor(private readonly variableLocationsService: VariableLocationsService) { }

    @Post()
    addLocation(
        @Param("variableId", ParseUUIDPipe) variableId: string,
        @Body() dto: AddVariableLocationDto
    ) {
        return this.variableLocationsService.addLocation(variableId, dto.locationId);
    }

    @Get()
    findAll(@Param("variableId", ParseUUIDPipe) variableId: string) {
        return this.variableLocationsService.findByVariable(variableId);
    }

    @Delete(":locationId")
    removeLocation(
        @Param("variableId", ParseUUIDPipe) variableId: string,
        @Param("locationId", ParseUUIDPipe) locationId: string
    ) {
        return this.variableLocationsService.removeLocation(variableId, locationId);
    }
}
