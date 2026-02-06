import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CommunesService } from "../services/communes.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/communes")
export class CommunesController {
    constructor(private readonly communesService: CommunesService) { }

    @Get("select")
    @RequirePermission("/sub/variables", "READ")
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
