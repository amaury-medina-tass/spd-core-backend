import { Body, Controller, Delete, Get, Param, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { IndicatorLocationsService } from "../../services/indicator-locations.service";
import { AddIndicatorLocationDto } from "../../dtos/add-indicator-location.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ActionPlanIndicatorLocationsController {
    constructor(private readonly indicatorLocationsService: IndicatorLocationsService) { }

    @Post(":indicatorId/locations")
    @RequirePermission("/masters/indicators", "CREATE")
    addLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Body() dto: AddIndicatorLocationDto
    ) {
        return this.indicatorLocationsService.addLocationToActionIndicator(indicatorId, dto.locationId);
    }

    @Get(":indicatorId/locations")
    @RequirePermission("/masters/indicators", "READ")
    findAll(@Param("indicatorId", ParseUUIDPipe) indicatorId: string) {
        return this.indicatorLocationsService.findByActionIndicator(indicatorId);
    }

    @Delete(":indicatorId/locations/:locationId")
    @RequirePermission("/masters/indicators", "DELETE")
    removeLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Param("locationId", ParseUUIDPipe) locationId: string
    ) {
        return this.indicatorLocationsService.removeLocationFromActionIndicator(indicatorId, locationId);
    }

    /**
     * Buscar indicadores de acción por código de comuna
     * Retorna indicadores que tienen ubicación directa en la comuna
     * O indicadores cuyas variables tienen ubicaciones en la comuna
     */
    @Get("locations/by-commune/:communeCode")
    @RequirePermission("/masters/indicators", "READ")
    findByCommuneCode(
        @Param("communeCode") communeCode: string,
        @Query("page") page: string = "1",
        @Query("limit") limit: string = "10",
        @Query("search") search?: string
    ) {
        return this.indicatorLocationsService.findActionIndicatorsByCommuneCode(
            communeCode,
            Number.parseInt(page, 10) || 1,
            Number.parseInt(limit, 10) || 10,
            search
        );
    }

    /**
     * Buscar variables asociadas al indicador que compartan la misma comuna o ubicación
     */
    @Get(":indicatorId/locations/variables")
    @RequirePermission("/masters/indicators", "READ")
    findVariablesByLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("page") page: string = "1",
        @Query("limit") limit: string = "10",
        @Query("search") search?: string
    ) {
        return this.indicatorLocationsService.findVariablesByActionIndicatorLocation(
            indicatorId,
            Number.parseInt(page, 10) || 1,
            Number.parseInt(limit, 10) || 10,
            search
        );
    }
}
