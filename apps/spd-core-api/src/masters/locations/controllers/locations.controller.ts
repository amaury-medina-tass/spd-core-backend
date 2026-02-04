import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { LocationsService } from "../services/locations.service";
import { CreateLocationDto } from "../dtos/create-location.dto";

@Controller("masters/locations")
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Post()
    create(@Body() createDto: CreateLocationDto) {
        return this.locationsService.create(createDto);
    }

    @Get("select")
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
