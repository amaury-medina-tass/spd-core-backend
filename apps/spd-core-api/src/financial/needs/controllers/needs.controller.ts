import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { NeedsService } from "../services/needs.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/needs")
export class NeedsController {
    constructor(private readonly service: NeedsService) { }

    @Get()
    @ResponseMessage("Listado de necesidades")
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
    @ResponseMessage("Detalle de la necesidad")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}
