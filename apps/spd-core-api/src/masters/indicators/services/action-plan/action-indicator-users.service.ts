import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActionIndicatorUser } from "../../entities/action-plan/action-indicator-user.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { BaseIndicatorUsersService, IndicatorUsersConfig } from "../base";

@Injectable()
export class ActionIndicatorUsersService extends BaseIndicatorUsersService<ActionIndicatorUser, ActionPlanIndicator> {
    protected readonly logger = new Logger(ActionIndicatorUsersService.name);
    protected readonly config: IndicatorUsersConfig = {
        indicatorNotFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
        auditAssignAction: AuditAction.ACTION_INDICATOR_USER_ASSIGNED,
        auditUnassignAction: AuditAction.ACTION_INDICATOR_USER_UNASSIGNED,
        auditEntityType: AuditEntityType.ACTION_INDICATOR,
    };

    constructor(
        @InjectRepository(ActionIndicatorUser)
        protected readonly repo: Repository<ActionIndicatorUser>,
        @InjectRepository(ActionPlanIndicator)
        protected readonly indicatorRepo: Repository<ActionPlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
