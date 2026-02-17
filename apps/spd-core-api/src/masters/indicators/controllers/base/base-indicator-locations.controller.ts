import { Body, Delete, Get, Param, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { AddIndicatorLocationDto } from "../../dtos/add-indicator-location.dto";

/**
 * Interface that the IndicatorLocationsService must implement
 * for each plan type's addLocation / findBy / removeLocation / findByCommuneCode / findVariablesByLocation methods.
 */
export interface IIndicatorLocationsActions {
    addLocation(indicatorId: string, locationId: string): Promise<any>;
    findByIndicator(indicatorId: string): Promise<any>;
    removeLocation(indicatorId: string, locationId: string): Promise<any>;
    findIndicatorsByCommuneCode(
        communeCode: string,
        page: number,
        limit: number,
        search?: string,
    ): Promise<any>;
    findVariablesByIndicatorLocation(
        indicatorId: string,
        page: number,
        limit: number,
        search?: string,
    ): Promise<any>;
}

/**
 * Abstract base controller for indicator locations.
 * Shared between action-plan and indicative-plan controllers.
 *
 * Subclasses MUST apply @Controller() and @UseGuards() decorators,
 * and provide a concrete IIndicatorLocationsActions implementation.
 */
export abstract class BaseIndicatorLocationsController {
    protected abstract readonly locationActions: IIndicatorLocationsActions;

    @Post(":indicatorId/locations")
    @RequirePermission("/masters/indicators", "CREATE")
    addLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Body() dto: AddIndicatorLocationDto,
    ) {
        return this.locationActions.addLocation(indicatorId, dto.locationId);
    }

    @Get(":indicatorId/locations")
    @RequirePermission("/masters/indicators", "READ")
    findAll(@Param("indicatorId", ParseUUIDPipe) indicatorId: string) {
        return this.locationActions.findByIndicator(indicatorId);
    }

    @Delete(":indicatorId/locations/:locationId")
    @RequirePermission("/masters/indicators", "DELETE")
    removeLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Param("locationId", ParseUUIDPipe) locationId: string,
    ) {
        return this.locationActions.removeLocation(indicatorId, locationId);
    }

    @Get("locations/by-commune/:communeCode")
    @RequirePermission("/masters/indicators", "READ")
    findByCommuneCode(
        @Param("communeCode") communeCode: string,
        @Query("page") page: string = "1",
        @Query("limit") limit: string = "10",
        @Query("search") search?: string,
    ) {
        return this.locationActions.findIndicatorsByCommuneCode(
            communeCode,
            Number.parseInt(page, 10) || 1,
            Number.parseInt(limit, 10) || 10,
            search,
        );
    }

    @Get(":indicatorId/locations/variables")
    @RequirePermission("/masters/indicators", "READ")
    findVariablesByLocation(
        @Param("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("page") page: string = "1",
        @Query("limit") limit: string = "10",
        @Query("search") search?: string,
    ) {
        return this.locationActions.findVariablesByIndicatorLocation(
            indicatorId,
            Number.parseInt(page, 10) || 1,
            Number.parseInt(limit, 10) || 10,
            search,
        );
    }
}
