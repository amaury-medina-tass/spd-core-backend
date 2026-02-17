import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { FundingSourcesService } from "../services/funding-sources.service";
import { CreateFundingSourceDto } from "../dtos/create-funding-source.dto";
import { BaseReadPaginatedSelectController } from "../../../shared/controllers";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission("/financial/projects", "READ")
@Controller("financial/funding-sources")
export class FundingSourcesController extends BaseReadPaginatedSelectController {
    protected readonly service: FundingSourcesService;
    protected readonly entityLabel = "Fuentes de financiación";

    constructor(service: FundingSourcesService) {
        super();
        this.service = service;
    }

    @Post()
    @RequirePermission("/financial/projects", "CREATE")
    @ResponseMessage("Fuente de financiación creada exitosamente")
    create(@Body() dto: CreateFundingSourceDto) {
        return this.service.create(dto);
    }

    @Patch(":id")
    @RequirePermission("/financial/projects", "UPDATE")
    @ResponseMessage("Fuente de financiación actualizada exitosamente")
    update(@Param("id") id: string, @Body() dto: Partial<CreateFundingSourceDto>) {
        return this.service.update(id, dto);
    }

    @Delete(":id")
    @RequirePermission("/financial/projects", "DELETE")
    @ResponseMessage("Fuente de financiación eliminada exitosamente")
    delete(@Param("id") id: string) {
        return this.service.delete(id);
    }
}
