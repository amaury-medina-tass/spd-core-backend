import { Controller, UseGuards } from "@nestjs/common";
import { IndicatorLocationsService } from "../../services/indicator-locations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseIndicatorLocationsController, IIndicatorLocationsActions } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class ActionPlanIndicatorLocationsController extends BaseIndicatorLocationsController {
    protected readonly locationActions: IIndicatorLocationsActions;

    constructor(private readonly indicatorLocationsService: IndicatorLocationsService) {
        super();
        this.locationActions = {
            addLocation: (indicatorId, locationId) =>
                this.indicatorLocationsService.addLocationToActionIndicator(indicatorId, locationId),
            findByIndicator: (indicatorId) =>
                this.indicatorLocationsService.findByActionIndicator(indicatorId),
            removeLocation: (indicatorId, locationId) =>
                this.indicatorLocationsService.removeLocationFromActionIndicator(indicatorId, locationId),
            findIndicatorsByCommuneCode: (communeCode, page, limit, search) =>
                this.indicatorLocationsService.findActionIndicatorsByCommuneCode(communeCode, page, limit, search),
            findVariablesByIndicatorLocation: (indicatorId, page, limit, search) =>
                this.indicatorLocationsService.findVariablesByActionIndicatorLocation(indicatorId, page, limit, search),
        };
    }
}
