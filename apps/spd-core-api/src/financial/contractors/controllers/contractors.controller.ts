import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { ContractorsService } from "../services/contractors.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/contractors")
export class ContractorsController {
    constructor(private readonly service: ContractorsService) { }

    @Get()
    @ResponseMessage("Listado de contratistas")
    findAll(@Query("search") search: string) {
        return this.service.findAll(search);
    }
}
