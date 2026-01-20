import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpPositionsService } from "../services/cdp-positions.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/cdps")
export class CdpPositionsController {
    constructor(private readonly service: CdpPositionsService) { }

    @Get(":cdpId/positions")
    @ResponseMessage("Listado de posiciones del CDP")
    findByCdpId(
        @Param("cdpId") cdpId: string,
        @Query("search") search: string
    ) {
        return this.service.findByCdpId(cdpId, search);
    }

    @Get("positions/:id")
    @ResponseMessage("Detalle de la posición CDP")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    @Patch("positions/:id/observations")
    @ResponseMessage("Observaciones actualizadas exitosamente")
    updateObservations(
        @Param("id") id: string,
        @Body("observations") observations: string
    ) {
        return this.service.updateObservations(id, observations);
    }
}
