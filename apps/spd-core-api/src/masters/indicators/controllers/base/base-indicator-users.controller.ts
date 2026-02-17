import { Body, Delete, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { AssignUserDto } from "../../dtos/assign-user.dto";

/**
 * Interface that any indicator-users service must implement
 * to be used with BaseIndicatorUsersController.
 */
export interface IIndicatorUsersService {
    findByIndicatorId(indicatorId: string): Promise<any>;
    assign(indicatorId: string, userId: string, userName: string): Promise<any>;
    unassign(indicatorId: string, userId: string): Promise<any>;
}

/**
 * Abstract base controller for indicator user assignments.
 * Shared between action-plan and indicative-plan controllers.
 *
 * Subclasses MUST apply @Controller() and @UseGuards() decorators.
 */
export abstract class BaseIndicatorUsersController {
    protected abstract readonly service: IIndicatorUsersService;

    @Get(":id/users")
    @RequirePermission("/masters/indicators", "READ")
    findUsers(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findByIndicatorId(id);
    }

    @Post(":id/users")
    @RequirePermission("/masters/indicators", "UPDATE")
    assignUser(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AssignUserDto) {
        return this.service.assign(id, dto.userId, dto.userName);
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
