import { Controller, UseGuards } from "@nestjs/common";
import { IndicatorLocationsService } from "../../services/indicator-locations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseIndicatorLocationsController, IIndicatorLocationsActions } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicative-plan-indicators")
export class IndicativePlanIndicatorLocationsController extends BaseIndicatorLocationsController {
    protected readonly locationActions: IIndicatorLocationsActions;

    constructor(private readonly indicatorLocationsService: IndicatorLocationsService) {
        super();
        this.locationActions = {
            addLocation: (indicatorId, locationId) =>
                this.indicatorLocationsService.addLocationToIndicativeIndicator(indicatorId, locationId),
            findByIndicator: (indicatorId) =>
                this.indicatorLocationsService.findByIndicativeIndicator(indicatorId),
            removeLocation: (indicatorId, locationId) =>
                this.indicatorLocationsService.removeLocationFromIndicativeIndicator(indicatorId, locationId),
            findIndicatorsByCommuneCode: (communeCode, page, limit, search) =>
                this.indicatorLocationsService.findIndicativeIndicatorsByCommuneCode(communeCode, page, limit, search),
            findVariablesByIndicatorLocation: (indicatorId, page, limit, search) =>
                this.indicatorLocationsService.findVariablesByIndicativeIndicatorLocation(indicatorId, page, limit, search),
        };
    }
}
