import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { ActionPlanIndicatorQuadrennium } from "../../entities/action-plan/action-plan-indicator-quadrennium.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { BaseIndicatorQuadrenniumsService, IndicatorQuadrenniumsConfig } from "../base";

@Injectable()
export class ActionPlanIndicatorQuadrenniumsService extends BaseIndicatorQuadrenniumsService<ActionPlanIndicatorQuadrennium, ActionPlanIndicator> {
    protected readonly logger = new Logger(ActionPlanIndicatorQuadrenniumsService.name);
    protected readonly config: IndicatorQuadrenniumsConfig = {
        indicatorNotFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
        quadrenniumNotFoundCode: ErrorCodes.ACTION_INDICATOR_QUADRENNIUM_NOT_FOUND,
        auditCreateAction: AuditAction.ACTION_INDICATOR_QUADRENNIUM_CREATED,
        auditUpdateAction: AuditAction.ACTION_INDICATOR_QUADRENNIUM_UPDATED,
        auditDeleteAction: AuditAction.ACTION_INDICATOR_QUADRENNIUM_DELETED,
        auditEntityType: AuditEntityType.ACTION_INDICATOR_QUADRENNIUM,
        quadrenniumLabel: "Action Quadrennium",
    };

    constructor(
        @InjectRepository(ActionPlanIndicatorQuadrennium)
        protected readonly quadrenniumRepository: Repository<ActionPlanIndicatorQuadrennium>,
        @InjectRepository(ActionPlanIndicator)
        protected readonly parentRepository: Repository<ActionPlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
