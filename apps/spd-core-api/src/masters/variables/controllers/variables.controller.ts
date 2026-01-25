import { Body, Controller, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";
import { VariablesService } from "../services/variables.service";
import { CreateVariableDto } from "../dtos/create-variable.dto";
import { UpdateVariableDto } from "../dtos/update-variable.dto";

@Controller("masters/variables")
export class VariablesController {
    constructor(private readonly variablesService: VariablesService) { }

    @Post()
    create(@Body() createDto: CreateVariableDto) {
        return this.variablesService.create(createDto);
    }

    @Get("select")
    findForSelect(
        @Query("search") search?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number
    ) {
        return this.variablesService.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0
        );
    }

    @Get()
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC"
    ) {
        return this.variablesService.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder
        );
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.variablesService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateVariableDto
    ) {
        return this.variablesService.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.variablesService.remove(id);
    }
}
