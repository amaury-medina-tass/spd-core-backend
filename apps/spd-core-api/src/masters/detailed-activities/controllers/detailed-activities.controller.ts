import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { DetailedActivitiesService } from "../services/detailed-activities.service";
import { CreateDetailedActivityDto } from "../dtos/create-detailed-activity.dto";
import { UpdateDetailedActivityDto } from "../dtos/update-detailed-activity.dto";

@Controller("masters/detailed-activities")
export class DetailedActivitiesController {
    constructor(private readonly detailedActivitiesService: DetailedActivitiesService) { }

    @Post()
    create(@Body() createDto: CreateDetailedActivityDto) {
        return this.detailedActivitiesService.create(createDto);
    }

    @Get()
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
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.detailedActivitiesService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDetailedActivityDto
    ) {
        return this.detailedActivitiesService.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.detailedActivitiesService.remove(id);
    }
}
