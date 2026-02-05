import { Body, Controller, Get, Param, Post, Query, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { BudgetModificationsService } from "../services/budget-modifications.service";
import { CreateBudgetModificationDto } from "../dtos/create-budget-modification.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/budget-modifications")
export class BudgetModificationsController {
    constructor(private readonly budgetModificationsService: BudgetModificationsService) { }

    @Post()
    @RequirePermission("/masters/activities", "BUDGET_MODIFICATION")
    create(@Body() createDto: CreateBudgetModificationDto) {
        return this.budgetModificationsService.create(createDto);
    }

    @Get()
    @RequirePermission("/masters/activities", "BUDGET_MODIFICATION")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
        @Query("detailedActivityId") detailedActivityId: string
    ) {
        return this.budgetModificationsService.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
            detailedActivityId
        );
    }

    @Get(":id")
    @RequirePermission("/masters/activities", "BUDGET_MODIFICATION")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.budgetModificationsService.findOne(id);
    }
}
