import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "../services/products.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/products")
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @RequirePermission("/masters/activities", "READ")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.productsService.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get("select")
    @RequirePermission("/masters/activities", "READ")
    findForSelect(
        @Query("search") search?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number
    ) {
        return this.productsService.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }
}
