import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { VariableGoal } from "../entities/variable-goal.entity";
import { Variable } from "../entities/variable.entity";
import { BaseIndicatorGoalsService, IndicatorGoalsConfig } from "../../indicators/services/base";

@Injectable()
export class VariableGoalsService extends BaseIndicatorGoalsService<VariableGoal, Variable> {
    protected readonly logger = new Logger(VariableGoalsService.name);
    protected readonly config: IndicatorGoalsConfig = {
        goalNotFoundCode: ErrorCodes.VARIABLE_GOAL_NOT_FOUND,
        auditCreateAction: AuditAction.VARIABLE_GOAL_CREATED,
        auditUpdateAction: AuditAction.VARIABLE_GOAL_UPDATED,
        auditDeleteAction: AuditAction.VARIABLE_GOAL_DELETED,
        auditEntityType: AuditEntityType.VARIABLE_GOAL,
        goalLabel: "Variable Goal",
        parentRelation: "variable",
        parentIdField: "variableId",
        checkParentOnCreate: false,
        duplicateMessage: "Ya existe una meta para esta variable en el año especificado",
        alias: "vg",
    };

    constructor(
        @InjectRepository(VariableGoal)
        protected readonly goalRepository: Repository<VariableGoal>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
