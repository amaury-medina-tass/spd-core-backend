import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndicativeIndicatorUser } from "../../entities/indicative-plan/indicative-indicator-user.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { BaseIndicatorUsersService, IndicatorUsersConfig } from "../base";

@Injectable()
export class IndicativeIndicatorUsersService extends BaseIndicatorUsersService<IndicativeIndicatorUser, IndicativePlanIndicator> {
    protected readonly logger = new Logger(IndicativeIndicatorUsersService.name);
    protected readonly config: IndicatorUsersConfig = {
        indicatorNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
        auditAssignAction: AuditAction.INDICATIVE_INDICATOR_USER_ASSIGNED,
        auditUnassignAction: AuditAction.INDICATIVE_INDICATOR_USER_UNASSIGNED,
        auditEntityType: AuditEntityType.INDICATIVE_INDICATOR,
    };

    constructor(
        @InjectRepository(IndicativeIndicatorUser)
        protected readonly repo: Repository<IndicativeIndicatorUser>,
        @InjectRepository(IndicativePlanIndicator)
        protected readonly indicatorRepo: Repository<IndicativePlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
