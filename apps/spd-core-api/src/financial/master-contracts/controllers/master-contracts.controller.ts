import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { MasterContractsService } from "../services/master-contracts.service";
import { CdpPositionsService } from "../../cdps/services/cdp-positions.service";
import { BaseReadPaginatedController } from "../../../shared/controllers";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission("/financial/master-contracts", "READ")
@Controller("financial/master-contracts")
export class MasterContractsController extends BaseReadPaginatedController {
    protected readonly service: MasterContractsService;
    protected readonly entityLabel = "Contratos marco";

    constructor(
        service: MasterContractsService,
        private readonly cdpPositionsService: CdpPositionsService,
    ) {
        super();
        this.service = service;
    }

    @Get(":id/cdp-positions")
    @RequirePermission("/financial/master-contracts", "READ")
    @ResponseMessage("Posiciones CDP asociadas al contrato marco")
    findAssociatedCdpPositions(
        @Param("id") id: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.cdpPositionsService.findForTable(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
            id,
        );
    }
}
