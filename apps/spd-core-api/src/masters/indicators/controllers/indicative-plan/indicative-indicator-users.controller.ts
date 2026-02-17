import { Controller, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { IndicativeIndicatorUsersService } from "../../services/indicative-plan/indicative-indicator-users.service";
import { BaseIndicatorUsersController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicators")
export class IndicativeIndicatorUsersController extends BaseIndicatorUsersController {
    protected readonly service: IndicativeIndicatorUsersService;

    constructor(service: IndicativeIndicatorUsersService) {
        super();
        this.service = service;
    }
}
