import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpFundingService } from "../services/cdp-funding.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/cdps")
export class CdpFundingController {
    constructor(private readonly service: CdpFundingService) { }

    @Post("positions/:positionId/consume")
    @ResponseMessage("Fondos consumidos exitosamente")
    consumeActivity(
        @Param("positionId") positionId: string,
        @Body("detailedActivityId") detailedActivityId: string,
        @Body("amount") amount: number
    ) {
        return this.service.consumeActivity(positionId, detailedActivityId, +amount);
    }
}
