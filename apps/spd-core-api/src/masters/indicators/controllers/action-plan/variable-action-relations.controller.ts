import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { VariableActionRelationsService } from "../../services/action-plan/variable-action-relations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class VariableActionRelationsController {
    constructor(private readonly relationsService: VariableActionRelationsService) { }

    @Post(":id/variables")
    @RequirePermission("/masters/indicators", "CREATE")
    associate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body("variableId", ParseUUIDPipe) variableId: string
    ) {
        return this.relationsService.associate(id, variableId);
    }

    @Delete(":id/variables/:variableId")
    @RequirePermission("/masters/indicators", "DELETE")
    disassociate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("variableId", ParseUUIDPipe) variableId: string
    ) {
        return this.relationsService.disassociate(id, variableId);
    }

    @Get(":id/variables")
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
