import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { VariableGoalsService } from "../services/variable-goals.service";
import { CreateVariableGoalDto } from "../dtos/create-variable-goal.dto";
import { UpdateVariableGoalDto } from "../dtos/update-variable-goal.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/variable-goals")
export class VariableGoalsController {
    constructor(private readonly variableGoalsService: VariableGoalsService) { }

    @Post()
    @RequirePermission("/masters/variables", "CREATE")
    create(@Body() createDto: CreateVariableGoalDto) {
        return this.variableGoalsService.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/variables", "READ")
    findAll(
        @Query("variableId", ParseUUIDPipe) variableId: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.variableGoalsService.findAllPaginated(
            variableId,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Patch(":id")
    @RequirePermission("/masters/variables", "UPDATE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateVariableGoalDto
    ) {
        return this.variableGoalsService.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/variables", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.variableGoalsService.remove(id);
    }
}
