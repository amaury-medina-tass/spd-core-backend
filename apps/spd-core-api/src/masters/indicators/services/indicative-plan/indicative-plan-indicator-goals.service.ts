import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { IndicativePlanIndicatorGoal } from "../../entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { BaseIndicatorGoalsService, IndicatorGoalsConfig } from "../base";

@Injectable()
export class IndicativePlanIndicatorGoalsService extends BaseIndicatorGoalsService<IndicativePlanIndicatorGoal, IndicativePlanIndicator> {
    protected readonly logger = new Logger(IndicativePlanIndicatorGoalsService.name);
    protected readonly config: IndicatorGoalsConfig = {
        indicatorNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
        goalNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_GOAL_NOT_FOUND,
        auditCreateAction: AuditAction.INDICATIVE_INDICATOR_GOAL_CREATED,
        auditUpdateAction: AuditAction.INDICATIVE_INDICATOR_GOAL_UPDATED,
        auditDeleteAction: AuditAction.INDICATIVE_INDICATOR_GOAL_DELETED,
        auditEntityType: AuditEntityType.INDICATIVE_INDICATOR_GOAL,
        goalLabel: "Indicative Goal",
    };

    constructor(
        @InjectRepository(IndicativePlanIndicatorGoal)
        protected readonly goalRepository: Repository<IndicativePlanIndicatorGoal>,
        @InjectRepository(IndicativePlanIndicator)
        protected readonly parentRepository: Repository<IndicativePlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
