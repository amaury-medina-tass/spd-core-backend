import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { PreviousStudiesService } from "../services/previous-studies.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/previous-studies")
export class PreviousStudiesController {
    constructor(private readonly service: PreviousStudiesService) { }

    @Get()
    @ResponseMessage("Listado de estudios previos")
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
}
