import { Controller, UseGuards } from "@nestjs/common";
import { IndicativePlanIndicatorGoalsService } from "../../services/indicative-plan/indicative-plan-indicator-goals.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseIndicatorGoalsController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicative-plan-indicators-goals")
export class IndicativePlanIndicatorGoalsController extends BaseIndicatorGoalsController {
    protected readonly service: IndicativePlanIndicatorGoalsService;
    protected readonly permissionPath = "/masters/indicative-plan-indicators-goals";

    constructor(service: IndicativePlanIndicatorGoalsService) {
        super();
        this.service = service;
    }
}
