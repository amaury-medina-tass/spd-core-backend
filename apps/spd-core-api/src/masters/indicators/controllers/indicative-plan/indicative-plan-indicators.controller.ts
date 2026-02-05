import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";

import { IndicativePlanIndicatorsService } from "../../services/indicative-plan/indicative-plan-indicators.service";
import { CreateIndicativePlanIndicatorDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator.dto";
import { UpdateIndicativePlanIndicatorDto } from "../../dtos/indicative-plan/update-indicative-plan-indicator.dto";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicators")
export class IndicativePlanIndicatorsController {
    constructor(private readonly indicatorsService: IndicativePlanIndicatorsService) { }

    @Get("catalogs")
    @RequirePermission("/masters/indicators", "READ")
    findAllCatalogs() {
        return this.indicatorsService.getCatalogs();
    }

    @Post()
    @RequirePermission("/masters/indicators", "CREATE")
    create(@Body() createDto: CreateIndicativePlanIndicatorDto) {
        return this.indicatorsService.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/indicators", "READ")
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
    @RequirePermission("/masters/indicators", "READ")
    findOne(@Param("id") id: string) {
        return this.indicatorsService.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/indicators", "UPDATE")
    update(@Param("id") id: string, @Body() updateDto: UpdateIndicativePlanIndicatorDto) {
        return this.indicatorsService.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/indicators", "DELETE")
    remove(@Param("id") id: string) {
        return this.indicatorsService.remove(id);
    }
}
