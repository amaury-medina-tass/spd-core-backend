import { Controller, Get, Query } from "@nestjs/common";
import { CommunesService } from "../services/communes.service";

@Controller("masters/communes")
export class CommunesController {
    constructor(private readonly communesService: CommunesService) { }

    @Get("select")
    findForSelect(
        @Query("search") search?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number
    ) {
        return this.communesService.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }
}
