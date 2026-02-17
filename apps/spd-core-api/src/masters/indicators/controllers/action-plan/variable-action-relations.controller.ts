import { Controller, UseGuards } from "@nestjs/common";
import { VariableActionRelationsService } from "../../services/action-plan/variable-action-relations.service";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { BaseVariableRelationsController } from "../base";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/action-plan-indicators")
export class VariableActionRelationsController extends BaseVariableRelationsController {
    protected readonly relationsService: VariableActionRelationsService;

    constructor(relationsService: VariableActionRelationsService) {
        super();
        this.relationsService = relationsService;
    }
}
