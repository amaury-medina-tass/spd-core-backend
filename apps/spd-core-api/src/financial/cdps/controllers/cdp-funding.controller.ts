import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpFundingService } from "../services/cdp-funding.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/cdps")
export class CdpFundingController {
    constructor(private readonly service: CdpFundingService) { }

    @Post("positions/:positionId/consume")
    @RequirePermission("/financial/cdps", "CREATE")
    @ResponseMessage("Fondos consumidos exitosamente")
    consumeActivity(
        @Param("positionId") positionId: string,
        @Body("detailedActivityId") detailedActivityId: string,
        @Body("amount") amount: number
    ) {
        return this.service.consumeActivity(positionId, detailedActivityId, +amount);
    }
}
