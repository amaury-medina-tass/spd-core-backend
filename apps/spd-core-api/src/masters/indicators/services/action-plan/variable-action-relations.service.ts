import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { VariableActionRelation } from "../../entities/action-plan/variable-action-relation.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { Variable } from "../../../variables/entities/variable.entity";
import { Formula } from "../../entities/formula.entity";
import { VariableAdvancesService } from "../../../../sub/variable-advances/services/variable-advances.service";
import { BaseVariableRelationsService, VariableRelationConfig } from "../base";

@Injectable()
export class VariableActionRelationsService extends BaseVariableRelationsService<VariableActionRelation, ActionPlanIndicator> {
    protected readonly logger = new Logger(VariableActionRelationsService.name);
    protected readonly config: VariableRelationConfig = {
        auditAssociateAction: AuditAction.VARIABLE_ACTION_RELATION_ASSOCIATED,
        auditDisassociateAction: AuditAction.VARIABLE_ACTION_RELATION_DISASSOCIATED,
        auditEntityType: AuditEntityType.VARIABLE_ACTION_RELATION,
        indicatorNotFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
        formulaIndicatorField: "actionIndicatorId",
        logLabel: "action",
    };

    constructor(
        @InjectRepository(VariableActionRelation)
        protected readonly relationRepository: Repository<VariableActionRelation>,
        @InjectRepository(ActionPlanIndicator)
        protected readonly indicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(Variable)
        protected readonly variableRepository: Repository<Variable>,
        @InjectRepository(Formula)
        protected readonly formulaRepository: Repository<Formula>,
        @Inject(forwardRef(() => VariableAdvancesService))
        protected readonly variableAdvancesService: VariableAdvancesService,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
