import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { VariableIndicativeRelationsService } from "../../services/indicative-plan/variable-indicative-relations.service";

@Controller("masters/indicators")
export class VariableIndicativeRelationsController {
    constructor(private readonly relationsService: VariableIndicativeRelationsService) { }

    @Post(":id/variables")
    associate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body("variableId", ParseUUIDPipe) variableId: string
    ) {
        return this.relationsService.associate(id, variableId);
    }

    @Delete(":id/variables/:variableId")
    disassociate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("variableId", ParseUUIDPipe) variableId: string
    ) {
        return this.relationsService.disassociate(id, variableId);
    }

    @Get(":id/variables")
    find(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("type") type: "associated" | "available" | "all" = "all",
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string
    ) {
        return this.relationsService.findPaginated(
            id,
            type,
            page ? +page : 1,
            limit ? +limit : 20,
            search
        );
    }
}
