import { Body, Controller, Get, Param, Post, Query, ParseUUIDPipe } from "@nestjs/common";
import { BudgetModificationsService } from "../services/budget-modifications.service";
import { CreateBudgetModificationDto } from "../dtos/create-budget-modification.dto";

@Controller("masters/budget-modifications")
export class BudgetModificationsController {
    constructor(private readonly budgetModificationsService: BudgetModificationsService) { }

    @Post()
    create(@Body() createDto: CreateBudgetModificationDto) {
        return this.budgetModificationsService.create(createDto);
    }

    @Get()
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
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.budgetModificationsService.findOne(id);
    }
}
