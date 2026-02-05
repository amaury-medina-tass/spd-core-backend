import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { MgaActivitiesService } from "../services/mga-activities.service";
import { CreateMgaActivityDto } from "../dtos/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dtos/update-mga-activity.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/mga-activities")
export class MgaActivitiesController {
    constructor(private readonly mgaActivitiesService: MgaActivitiesService) { }

    @Post()
    @RequirePermission("/masters/activities", "CREATE")
    create(@Body() createDto: CreateMgaActivityDto) {
        return this.mgaActivitiesService.create(createDto);
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
        return this.mgaActivitiesService.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get(":id")
    @RequirePermission("/masters/activities", "READ")
    findOne(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("activityPage") activityPage?: number,
        @Query("activityLimit") activityLimit?: number,
        @Query("activitySearch") activitySearch?: string
    ) {
        return this.mgaActivitiesService.findOne(
            id,
            activityPage ? +activityPage : 1,
            activityLimit ? +activityLimit : 10,
            activitySearch
        );
    }

    @Get(":id/detailed-activities")
    @RequirePermission("/masters/activities", "READ")
    getDetailedActivitiesForMga(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("type") type: "associated" | "available" | "all" = "all",
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string
    ) {
        return this.mgaActivitiesService.getDetailedActivitiesForMga(
            id,
            type || "all",
            page ? +page : 1,
            limit ? +limit : 20,
            search
        );
    }

    @Patch(":id")
    @RequirePermission("/masters/activities", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateMgaActivityDto
    ) {
        return this.mgaActivitiesService.update(id, updateDto);
    }

    @Post(":id/detailed-relations")
    @RequirePermission("/masters/activities", "ASSIGN_DETAILED_ACTIVITY")
    addDetailedRelation(
        @Param("id", ParseUUIDPipe) mgaActivityId: string,
        @Body("detailedActivityId") detailedActivityId: string
    ) {
        return this.mgaActivitiesService.addDetailedRelation(mgaActivityId, detailedActivityId);
    }

    @Delete(":id/detailed-relations/:detailedActivityId")
    @RequirePermission("/masters/activities", "ASSIGN_DETAILED_ACTIVITY")
    removeDetailedRelation(
        @Param("id", ParseUUIDPipe) mgaActivityId: string,
        @Param("detailedActivityId", ParseUUIDPipe) detailedActivityId: string
    ) {
        return this.mgaActivitiesService.removeDetailedRelation(mgaActivityId, detailedActivityId);
    }

    @Get(":id/detailed-relations")
    @RequirePermission("/masters/activities", "ASSIGN_DETAILED_ACTIVITY")
    getDetailedRelations(@Param("id", ParseUUIDPipe) id: string) {
        return this.mgaActivitiesService.getDetailedRelations(id);
    }
}
