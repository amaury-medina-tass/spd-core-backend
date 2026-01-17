import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { DependenciesService } from "../services/dependencies.service";

@UseGuards(JwtAuthGuard)
@Controller("financial/dependencies")
export class DependenciesController {
    constructor(private readonly service: DependenciesService) { }

    @Get()
    @ResponseMessage("Listado de dependencias")
    findAll(@Query("search") search: string) {
        return this.service.findAll(search);
    }
}
