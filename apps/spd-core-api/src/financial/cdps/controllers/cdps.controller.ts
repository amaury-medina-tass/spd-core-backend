import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpsService } from "../services/cdps.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/cdps")
export class CdpsController {
    constructor(private readonly service: CdpsService) { }

    @Get()
    @ResponseMessage("Listado de CDPs")
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

    @Get("select")
    @ResponseMessage("CDPs para selector")
    findForSelect(
        @Query("search") search: string,
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ) {
        return this.service.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }

    @Get(":id")
    @ResponseMessage("Detalle del CDP")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
