import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { CdpsService } from "../services/cdps.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/cdps")
export class CdpsController {
    constructor(private readonly service: CdpsService) { }

    // GET /financial/cdps - Lista paginada
    @Get()
    @RequirePermission("/financial/cdps", "READ")
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



    // GET /financial/cdps/select - Para selector/autocomplete
    @Get("select")
    @RequirePermission("/financial/cdps", "READ")
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

    // GET /financial/cdps/:id - Detalle (DEBE ir al final)
    @Get(":id")
    @RequirePermission("/financial/cdps", "READ")
    @ResponseMessage("Detalle del CDP")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
