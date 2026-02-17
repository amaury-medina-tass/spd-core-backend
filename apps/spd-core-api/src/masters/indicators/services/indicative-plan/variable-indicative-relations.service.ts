import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { VariableIndicativeRelation } from "../../entities/indicative-plan/variable-indicative-relation.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { Variable } from "../../../variables/entities/variable.entity";
import { Formula } from "../../entities/formula.entity";
import { VariableAdvancesService } from "../../../../sub/variable-advances/services/variable-advances.service";
import { BaseVariableRelationsService, VariableRelationConfig } from "../base";

@Injectable()
export class VariableIndicativeRelationsService extends BaseVariableRelationsService<VariableIndicativeRelation, IndicativePlanIndicator> {
    protected readonly logger = new Logger(VariableIndicativeRelationsService.name);
    protected readonly config: VariableRelationConfig = {
        auditAssociateAction: AuditAction.VARIABLE_INDICATIVE_RELATION_ASSOCIATED,
        auditDisassociateAction: AuditAction.VARIABLE_INDICATIVE_RELATION_DISASSOCIATED,
        auditEntityType: AuditEntityType.VARIABLE_INDICATIVE_RELATION,
        indicatorNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
        formulaIndicatorField: "indicativeIndicatorId",
        logLabel: "indicative",
    };

    constructor(
        @InjectRepository(VariableIndicativeRelation)
        protected readonly relationRepository: Repository<VariableIndicativeRelation>,
        @InjectRepository(IndicativePlanIndicator)
        protected readonly indicatorRepository: Repository<IndicativePlanIndicator>,
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
