import { Controller, Get, Query } from "@nestjs/common";
import { RubricsService } from "../services/rubrics.service";

@Controller("masters/rubrics")
export class RubricsController {
    constructor(private readonly rubricsService: RubricsService) { }

    @Get("select")
    findForSelect(
        @Query("search") search: string,
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ) {
        return this.rubricsService.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }
}
