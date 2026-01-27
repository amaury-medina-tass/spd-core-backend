import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ProjectActionIndicatorRelationsService } from "../../services/action-plan/project-action-indicator-relations.service";

@Controller("masters/action-plan-indicators")
export class ProjectActionIndicatorRelationsController {
    constructor(private readonly relationsService: ProjectActionIndicatorRelationsService) { }

    @Post(":id/projects")
    associate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body("projectId", ParseUUIDPipe) projectId: string
    ) {
        return this.relationsService.associate(id, projectId);
    }

    @Delete(":id/projects/:projectId")
    disassociate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("projectId", ParseUUIDPipe) projectId: string
    ) {
        return this.relationsService.disassociate(id, projectId);
    }

    @Get(":id/projects")
    find(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("type") type: "associated" | "available" | "all" = "all",
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string
    ) {
        return this.relationsService.findPaginated(
            id,
            type,
            page ? +page : 1,
            limit ? +limit : 20,
            search
        );
    }
}
