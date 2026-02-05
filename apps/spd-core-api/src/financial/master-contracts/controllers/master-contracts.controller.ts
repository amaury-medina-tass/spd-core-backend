import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { MasterContractsService } from "../services/master-contracts.service";
import { CdpPositionsService } from "../../cdps/services/cdp-positions.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/master-contracts")
export class MasterContractsController {
    constructor(
        private readonly service: MasterContractsService,
        private readonly cdpPositionsService: CdpPositionsService
    ) { }

    @Get()
    @RequirePermission("/financial/master-contracts", "READ")
    @ResponseMessage("Listado de contratos marco")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.service.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
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
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.cdpPositionsService.findForTable(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
            id // masterContractId
        );
    }
    @Get(":id")
    @RequirePermission("/financial/master-contracts", "READ")
    @ResponseMessage("Detalle del contrato marco")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
