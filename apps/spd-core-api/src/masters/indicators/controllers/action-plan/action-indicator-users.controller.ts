import { Controller, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { ActionIndicatorUsersService } from "../../services/action-plan/action-indicator-users.service";
import { BaseIndicatorUsersController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ActionIndicatorUsersController extends BaseIndicatorUsersController {
    protected readonly service: ActionIndicatorUsersService;

    constructor(service: ActionIndicatorUsersService) {
        super();
        this.service = service;
    }
}
