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

    @Get(":id/detailed-activities")
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
