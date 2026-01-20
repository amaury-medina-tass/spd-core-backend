import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { MgaActivitiesService } from "../services/mga-activities.service";
import { CreateMgaActivityDto } from "../dtos/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dtos/update-mga-activity.dto";

@Controller("masters/mga-activities")
export class MgaActivitiesController {
    constructor(private readonly mgaActivitiesService: MgaActivitiesService) { }

    @Post()
    create(@Body() createDto: CreateMgaActivityDto) {
        return this.mgaActivitiesService.create(createDto);
    }

    @Get()
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
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.mgaActivitiesService.findOne(id);
    }

    @Get(":id/associated-activities")
    getAssociatedActivities(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("search") search?: string
    ) {
        return this.mgaActivitiesService.getAssociatedActivities(
            id,
            limit ? +limit : 20,
            offset ? +offset : 0,
            search
        );
    }

    @Get(":id/available-activities")
    getAvailableActivities(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("search") search?: string
    ) {
        return this.mgaActivitiesService.getAvailableActivities(
            id,
            limit ? +limit : 20,
            offset ? +offset : 0,
            search
        );
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateMgaActivityDto
    ) {
        return this.mgaActivitiesService.update(id, updateDto);
    }

    @Post(":id/detailed-relations")
    addDetailedRelation(
        @Param("id", ParseUUIDPipe) mgaActivityId: string,
        @Body("detailedActivityId") detailedActivityId: string
    ) {
        return this.mgaActivitiesService.addDetailedRelation(mgaActivityId, detailedActivityId);
    }

    @Delete(":id/detailed-relations/:detailedActivityId")
    removeDetailedRelation(
        @Param("id", ParseUUIDPipe) mgaActivityId: string,
        @Param("detailedActivityId", ParseUUIDPipe) detailedActivityId: string
    ) {
        return this.mgaActivitiesService.removeDetailedRelation(mgaActivityId, detailedActivityId);
    }

    @Get(":id/detailed-relations")
    getDetailedRelations(@Param("id", ParseUUIDPipe) id: string) {
        return this.mgaActivitiesService.getDetailedRelations(id);
    }
}
