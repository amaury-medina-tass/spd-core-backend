import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { NeedsService } from "../services/needs.service";
import { BaseReadPaginatedController } from "../../../shared/controllers";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission("/financial/needs", "READ")
@Controller("financial/needs")
export class NeedsController extends BaseReadPaginatedController {
    protected readonly service: NeedsService;
    protected readonly entityLabel = "Necesidades";

    constructor(service: NeedsService) {
        super();
        this.service = service;
    }

    @Get(":id/cdp-positions")
    @RequirePermission("/financial/needs", "READ")
    @ResponseMessage("Posiciones CDP asociadas a la necesidad")
    getCdpPositionsByNeedId(
        @Param("id") id: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.service.findCdpPositionsByNeedId(
            id,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }
}
