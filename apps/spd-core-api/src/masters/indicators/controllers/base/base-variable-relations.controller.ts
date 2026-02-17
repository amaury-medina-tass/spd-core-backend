import { Body, Delete, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";

/**
 * Interface that any variable-relations service must implement
 * to be used with BaseVariableRelationsController.
 */
export interface IVariableRelationsService {
    associate(indicatorId: string, variableId: string): Promise<any>;
    disassociate(indicatorId: string, variableId: string): Promise<any>;
    findPaginated(
        indicatorId: string,
        type: "associated" | "available" | "all",
        page: number,
        limit: number,
        search?: string,
    ): Promise<any>;
}

/**
 * Abstract base controller for variable-indicator relations.
 * Shared between action-plan and indicative-plan controllers.
 *
 * Subclasses MUST apply @Controller() and @UseGuards() decorators.
 */
export abstract class BaseVariableRelationsController {
    protected abstract readonly relationsService: IVariableRelationsService;

    @Post(":id/variables")
    @RequirePermission("/masters/indicators", "CREATE")
    associate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body("variableId", ParseUUIDPipe) variableId: string,
    ) {
        return this.relationsService.associate(id, variableId);
    }

    @Delete(":id/variables/:variableId")
    @RequirePermission("/masters/indicators", "DELETE")
    disassociate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("variableId", ParseUUIDPipe) variableId: string,
    ) {
        return this.relationsService.disassociate(id, variableId);
    }

    @Get(":id/variables")
    @RequirePermission("/masters/indicators", "READ")
    find(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("type") type: "associated" | "available" | "all" = "all",
    ) {
        return this.relationsService.findPaginated(
            id,
            type,
            page ? +page : 1,
            limit ? +limit : 20,
            search,
        );
    }
}
