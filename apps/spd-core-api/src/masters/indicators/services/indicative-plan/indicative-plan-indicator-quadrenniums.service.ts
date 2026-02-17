import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { IndicativePlanIndicatorQuadrennium } from "../../entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { BaseIndicatorQuadrenniumsService, IndicatorQuadrenniumsConfig } from "../base";

@Injectable()
export class IndicativePlanIndicatorQuadrenniumsService extends BaseIndicatorQuadrenniumsService<IndicativePlanIndicatorQuadrennium, IndicativePlanIndicator> {
    protected readonly logger = new Logger(IndicativePlanIndicatorQuadrenniumsService.name);
    protected readonly config: IndicatorQuadrenniumsConfig = {
        indicatorNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
        quadrenniumNotFoundCode: ErrorCodes.INDICATIVE_INDICATOR_QUADRENNIUM_NOT_FOUND,
        auditCreateAction: AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_CREATED,
        auditUpdateAction: AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_UPDATED,
        auditDeleteAction: AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_DELETED,
        auditEntityType: AuditEntityType.INDICATIVE_INDICATOR_QUADRENNIUM,
        quadrenniumLabel: "Indicative Quadrennium",
    };

    constructor(
        @InjectRepository(IndicativePlanIndicatorQuadrennium)
        protected readonly quadrenniumRepository: Repository<IndicativePlanIndicatorQuadrennium>,
        @InjectRepository(IndicativePlanIndicator)
        protected readonly parentRepository: Repository<IndicativePlanIndicator>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
