import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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

    @Get("positions/table")
    @ResponseMessage("Tabla de posiciones de CDPs")
    findForTable(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.service.findForTable(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
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

    // GET /financial/cdps/positions/:positionId/detailed-activities
    @Get("positions/:positionId/detailed-activities")
    @ResponseMessage("Actividades detalladas de la posición CDP")
    getDetailedActivitiesForPosition(
        @Param("positionId") positionId: string,
        @Query("type") type: "associated" | "available" | "all" = "all",
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string
    ) {
        return this.service.getDetailedActivitiesForPosition(
            positionId,
            type || "all",
            page ? +page : 1,
            limit ? +limit : 20,
            search
        );
    }

    // POST /financial/cdps/positions/:positionId/detailed-activities
    @Post("positions/:positionId/detailed-activities")
    @ResponseMessage("Actividad asociada exitosamente")
    associateActivity(
        @Param("positionId") positionId: string,
        @Body("detailedActivityId") detailedActivityId: string
    ) {
        return this.service.associateActivity(positionId, detailedActivityId);
    }

    // DELETE /financial/cdps/positions/:positionId/detailed-activities/:detailedActivityId
    @Delete("positions/:positionId/detailed-activities/:detailedActivityId")
    @ResponseMessage("Actividad desasociada exitosamente")
    disassociateActivity(
        @Param("positionId") positionId: string,
        @Param("detailedActivityId") detailedActivityId: string
    ) {
        return this.service.disassociateActivity(positionId, detailedActivityId);
    }
}
