import { Controller, UseGuards } from "@nestjs/common";
import { ActionPlanIndicatorGoalsService } from "../../services/action-plan/action-plan-indicator-goals.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseIndicatorGoalsController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators-goals")
export class ActionPlanIndicatorGoalsController extends BaseIndicatorGoalsController {
    protected readonly service: ActionPlanIndicatorGoalsService;
    protected readonly permissionPath = "/masters/action-plan-indicators-goals";

    constructor(service: ActionPlanIndicatorGoalsService) {
        super();
        this.service = service;
    }
}
