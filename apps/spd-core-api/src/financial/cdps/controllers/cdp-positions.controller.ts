import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpPositionsService } from "../services/cdp-positions.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/cdps")
export class CdpPositionsController {
    constructor(private readonly service: CdpPositionsService) { }

    @Get(":cdpId/positions")
    @RequirePermission("/financial/cdps", "READ")
    @ResponseMessage("Listado de posiciones del CDP")
    findByCdpId(
        @Param("cdpId") cdpId: string,
        @Query("search") search: string
    ) {
        return this.service.findByCdpId(cdpId, search);
    }

    @Get("positions/table")
    @RequirePermission("/financial/cdps", "READ")
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
    @RequirePermission("/financial/cdps", "READ")
    @ResponseMessage("Detalle de la posición CDP")
    findOne(
        @Param("id") id: string,
        @Query("activityPage") activityPage?: number,
        @Query("activityLimit") activityLimit?: number,
        @Query("activitySearch") activitySearch?: string
    ) {
        return this.service.findOne(
            id,
            activityPage ? +activityPage : 1,
            activityLimit ? +activityLimit : 10,
            activitySearch
        );
    }

    @Patch("positions/:id/observations")
    @RequirePermission("/financial/cdps", "UPDATE")
    @ResponseMessage("Observaciones actualizadas exitosamente")
    updateObservations(
        @Param("id") id: string,
        @Body("observations") observations: string
    ) {
        return this.service.updateObservations(id, observations);
    }

    // GET /financial/cdps/positions/:positionId/detailed-activities
    @Get("positions/:positionId/detailed-activities")
    @RequirePermission("/financial/cdps", "ASSIGN_DETAILED_ACTIVITY")
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
    @RequirePermission("/financial/cdps", "ASSIGN_DETAILED_ACTIVITY")
    @ResponseMessage("Actividad asociada exitosamente")
    associateActivity(
        @Param("positionId") positionId: string,
        @Body("detailedActivityId") detailedActivityId: string
    ) {
        return this.service.associateActivity(positionId, detailedActivityId);
    }

    // DELETE /financial/cdps/positions/:positionId/detailed-activities/:detailedActivityId
    @Delete("positions/:positionId/detailed-activities/:detailedActivityId")
    @RequirePermission("/financial/cdps", "ASSIGN_DETAILED_ACTIVITY")
    @ResponseMessage("Actividad desasociada exitosamente")
    disassociateActivity(
        @Param("positionId") positionId: string,
        @Param("detailedActivityId") detailedActivityId: string
    ) {
        return this.service.disassociateActivity(positionId, detailedActivityId);
    }
}
