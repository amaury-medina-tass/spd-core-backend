import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SubUserFilterService } from "../services/sub-user-filter.service";
import type { JwtPayload } from "../../common/types/jwt-payload.type";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sub/my")
export class SubUserFilterController {
    constructor(private readonly service: SubUserFilterService) { }

    @Get("indicative-indicators")
    @RequirePermission("/sub/indicators", "READ")
    getMyIndicativeIndicators(
        @CurrentUser() user: JwtPayload,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    ) {
        return this.service.getIndicativeIndicatorsByUser(
            user.sub,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    @Get("action-indicators")
    @RequirePermission("/sub/indicators", "READ")
    getMyActionIndicators(
        @CurrentUser() user: JwtPayload,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    ) {
        return this.service.getActionIndicatorsByUser(
            user.sub,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    @Get("variables")
    @RequirePermission("/sub/variables", "READ")
    getMyVariables(
        @CurrentUser() user: JwtPayload,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    ) {
        return this.service.getVariablesByUser(
            user.sub,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }
}
