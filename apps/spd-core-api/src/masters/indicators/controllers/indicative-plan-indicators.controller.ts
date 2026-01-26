import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { IndicativePlanIndicatorsService } from "../services/indicative-plan-indicators.service";
import { CreateIndicativePlanIndicatorDto } from "../dtos/create-indicative-plan-indicator.dto";
import { UpdateIndicativePlanIndicatorDto } from "../dtos/update-indicative-plan-indicator.dto";

@Controller("masters/indicators")
export class IndicativePlanIndicatorsController {
    constructor(private readonly indicatorsService: IndicativePlanIndicatorsService) { }

    @Get("catalogs")
    findAllCatalogs() {
        return this.indicatorsService.getCatalogs();
    }

    @Post()
    create(@Body() createDto: CreateIndicativePlanIndicatorDto) {
        return this.indicatorsService.create(createDto);
    }

    @Get()
    findAll(
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 10,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("sortOrder") sortOrder?: "ASC" | "DESC"
    ) {
        // Ensure limit doesn't exceed 100
        const safeLimit = limit > 100 ? 100 : limit;
        return this.indicatorsService.findAllPaginated(
            page ? +page : 1,
            safeLimit ? +safeLimit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.indicatorsService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() updateDto: UpdateIndicativePlanIndicatorDto) {
        return this.indicatorsService.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.indicatorsService.remove(id);
    }
}
