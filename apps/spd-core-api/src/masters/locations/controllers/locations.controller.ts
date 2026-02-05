import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { LocationsService } from "../services/locations.service";
import { CreateLocationDto } from "../dtos/create-location.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/locations")
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Post()
    @RequirePermission("/masters/locations", "CREATE")
    create(@Body() createDto: CreateLocationDto) {
        return this.locationsService.create(createDto);
    }

    @Get("select")
    @RequirePermission("/masters/locations", "READ")
    findForSelect(
        @Query("search") search?: string,
        @Query("communeId") communeId?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number
    ) {
        return this.locationsService.findForSelect(
            search,
            communeId,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }
}
