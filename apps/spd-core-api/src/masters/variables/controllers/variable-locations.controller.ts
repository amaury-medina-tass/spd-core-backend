import { Body, Controller, Delete, Get, Param, Post, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { VariableLocationsService } from "../services/variable-locations.service";
import { AddVariableLocationDto } from "../dtos/add-variable-location.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/variables/:variableId/locations")
export class VariableLocationsController {
    constructor(private readonly variableLocationsService: VariableLocationsService) { }

    @Post()
    @RequirePermission("/masters/variables", "CREATE")
    addLocation(
        @Param("variableId", ParseUUIDPipe) variableId: string,
        @Body() dto: AddVariableLocationDto
    ) {
        return this.variableLocationsService.addLocation(variableId, dto.locationId);
    }

    @Get()
    @RequirePermission("/masters/variables", "READ")
    findAll(@Param("variableId", ParseUUIDPipe) variableId: string) {
        return this.variableLocationsService.findByVariable(variableId);
    }

    @Delete(":locationId")
    @RequirePermission("/masters/variables", "DELETE")
    removeLocation(
        @Param("variableId", ParseUUIDPipe) variableId: string,
        @Param("locationId", ParseUUIDPipe) locationId: string
    ) {
        return this.variableLocationsService.removeLocation(variableId, locationId);
    }
}
