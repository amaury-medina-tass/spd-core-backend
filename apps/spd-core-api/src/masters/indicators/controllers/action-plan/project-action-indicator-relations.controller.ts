import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ProjectActionIndicatorRelationsService } from "../../services/action-plan/project-action-indicator-relations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ProjectActionIndicatorRelationsController {
    constructor(private readonly relationsService: ProjectActionIndicatorRelationsService) { }

    @Post(":id/projects")
    @RequirePermission("/masters/indicators", "CREATE")
    associate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body("projectId", ParseUUIDPipe) projectId: string
    ) {
        return this.relationsService.associate(id, projectId);
    }

    @Delete(":id/projects/:projectId")
    @RequirePermission("/masters/indicators", "DELETE")
    disassociate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("projectId", ParseUUIDPipe) projectId: string
    ) {
        return this.relationsService.disassociate(id, projectId);
    }

    @Get(":id/projects")
    @RequirePermission("/masters/indicators", "READ")
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
