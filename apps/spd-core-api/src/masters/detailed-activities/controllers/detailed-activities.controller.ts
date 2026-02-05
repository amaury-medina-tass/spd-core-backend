import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { DetailedActivitiesService } from "../services/detailed-activities.service";
import { CreateDetailedActivityDto } from "../dtos/create-detailed-activity.dto";
import { UpdateDetailedActivityDto } from "../dtos/update-detailed-activity.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/detailed-activities")
export class DetailedActivitiesController {
    constructor(private readonly detailedActivitiesService: DetailedActivitiesService) { }

    @Post()
    @RequirePermission("/masters/activities", "CREATE")
    create(@Body() createDto: CreateDetailedActivityDto) {
        return this.detailedActivitiesService.create(createDto);
    }

    @Get("select")
    @RequirePermission("/masters/activities", "READ")
    findForSelect(
        @Query("search") search?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number
    ) {
        return this.detailedActivitiesService.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }

    @Get()
    @RequirePermission("/masters/activities", "READ")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.detailedActivitiesService.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get(":id")
    @RequirePermission("/masters/activities", "READ")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.detailedActivitiesService.findOne(id);
    }

    @Patch(":id")
    @RequirePermission("/masters/activities", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDetailedActivityDto
    ) {
        return this.detailedActivitiesService.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/activities", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.detailedActivitiesService.remove(id);
    }
}
