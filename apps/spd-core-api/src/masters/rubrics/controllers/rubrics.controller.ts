import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RubricsService } from "../services/rubrics.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/rubrics")
export class RubricsController {
    constructor(private readonly rubricsService: RubricsService) { }

    @Get("select")
    @RequirePermission("/masters/activities", "READ")
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
