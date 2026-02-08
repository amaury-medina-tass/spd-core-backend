import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { IndicativeIndicatorUsersService } from "../../services/indicative-plan/indicative-indicator-users.service";
import { AssignUserDto } from "../../dtos/assign-user.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicators")
export class IndicativeIndicatorUsersController {
    constructor(private readonly service: IndicativeIndicatorUsersService) { }

    @Get(":id/users")
    @RequirePermission("/masters/indicators", "READ")
    findUsers(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findByIndicatorId(id);
    }

    @Post(":id/users")
    @RequirePermission("/masters/indicators", "UPDATE")
    assignUser(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AssignUserDto) {
        return this.service.assign(id, dto.userId);
    }

    @Delete(":id/users/:userId")
    @RequirePermission("/masters/indicators", "UPDATE")
    unassignUser(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("userId", ParseUUIDPipe) userId: string,
    ) {
        return this.service.unassign(id, userId);
    }
}
