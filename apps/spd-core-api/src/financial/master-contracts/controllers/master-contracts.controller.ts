import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { MasterContractsService } from "../services/master-contracts.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/master-contracts")
export class MasterContractsController {
    constructor(private readonly service: MasterContractsService) { }

    @Get()
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
    @Get(":id")
    @ResponseMessage("Detalle del contrato marco")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
