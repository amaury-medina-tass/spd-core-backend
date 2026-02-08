import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { VariableUsersService } from "../services/variable-users.service";
import { AssignVariableUserDto } from "../dtos/assign-variable-user.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/variables")
export class VariableUsersController {
    constructor(private readonly service: VariableUsersService) { }

    @Get(":id/users")
    @RequirePermission("/masters/variables", "READ")
    findUsers(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findByVariableId(id);
    }

    @Post(":id/users")
    @RequirePermission("/masters/variables", "UPDATE")
    assignUser(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AssignVariableUserDto) {
        return this.service.assign(id, dto.userId, dto.userName);
    }

    @Delete(":id/users/:userId")
    @RequirePermission("/masters/variables", "UPDATE")
    unassignUser(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("userId", ParseUUIDPipe) userId: string,
    ) {
        return this.service.unassign(id, userId);
    }
}
