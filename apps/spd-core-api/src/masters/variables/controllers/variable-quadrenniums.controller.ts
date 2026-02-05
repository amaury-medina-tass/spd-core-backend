import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { VariableQuadrenniumsService } from "../services/variable-quadrenniums.service";
import { CreateVariableQuadrenniumDto } from "../dtos/create-variable-quadrennium.dto";
import { UpdateVariableQuadrenniumDto } from "../dtos/update-variable-quadrennium.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/variable-quadrenniums")
export class VariableQuadrenniumsController {
    constructor(private readonly variableQuadrenniumsService: VariableQuadrenniumsService) { }

    @Post()
    @RequirePermission("/masters/variables", "CREATE")
    create(@Body() createDto: CreateVariableQuadrenniumDto) {
        return this.variableQuadrenniumsService.create(createDto);
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
        return this.variableQuadrenniumsService.findAllPaginated(
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
        @Body() updateDto: UpdateVariableQuadrenniumDto
    ) {
        return this.variableQuadrenniumsService.update(id, updateDto);
    }

    @Delete(":id")
    @RequirePermission("/masters/variables", "DELETE")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.variableQuadrenniumsService.remove(id);
    }
}
