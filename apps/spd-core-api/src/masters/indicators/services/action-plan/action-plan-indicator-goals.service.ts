import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { ActionPlanIndicatorGoal } from "../../entities/action-plan/action-plan-indicator-goal.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { BaseIndicatorGoalsService, IndicatorGoalsConfig } from "../base";

@Injectable()
export class ActionPlanIndicatorGoalsService extends BaseIndicatorGoalsService<ActionPlanIndicatorGoal, ActionPlanIndicator> {
    protected readonly logger = new Logger(ActionPlanIndicatorGoalsService.name);
    protected readonly config: IndicatorGoalsConfig = {
        indicatorNotFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
        goalNotFoundCode: ErrorCodes.ACTION_INDICATOR_GOAL_NOT_FOUND,
        auditCreateAction: AuditAction.ACTION_INDICATOR_GOAL_CREATED,
        auditUpdateAction: AuditAction.ACTION_INDICATOR_GOAL_UPDATED,
        auditDeleteAction: AuditAction.ACTION_INDICATOR_GOAL_DELETED,
        auditEntityType: AuditEntityType.ACTION_INDICATOR_GOAL,
        goalLabel: "Action Goal",
    };

    constructor(
        @InjectRepository(ActionPlanIndicatorGoal)
        protected readonly goalRepository: Repository<ActionPlanIndicatorGoal>,
        @InjectRepository(ActionPlanIndicator)
        protected readonly parentRepository: Repository<ActionPlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
