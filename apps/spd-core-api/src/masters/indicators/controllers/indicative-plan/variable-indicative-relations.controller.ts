import { Controller, UseGuards } from "@nestjs/common";
import { VariableIndicativeRelationsService } from "../../services/indicative-plan/variable-indicative-relations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseVariableRelationsController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/indicators")
export class VariableIndicativeRelationsController extends BaseVariableRelationsController {
    protected readonly relationsService: VariableIndicativeRelationsService;

    constructor(relationsService: VariableIndicativeRelationsService) {
        super();
        this.relationsService = relationsService;
    }
}
