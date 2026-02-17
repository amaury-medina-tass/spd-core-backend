import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { UnitMeasure } from "../../entities/common/unit-measure.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { BasePlanIndicatorsService, PlanIndicatorsConfig, PaginatedQueryCustomization } from "../base";

@Injectable()
export class ActionPlanIndicatorsService extends BasePlanIndicatorsService<ActionPlanIndicator> {
    protected readonly logger = new Logger(ActionPlanIndicatorsService.name);
    protected readonly config: PlanIndicatorsConfig = {
        alreadyExistsCode: ErrorCodes.ACTION_INDICATOR_ALREADY_EXISTS,
        notFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
        auditCreateAction: AuditAction.ACTION_INDICATOR_CREATED,
        auditUpdateAction: AuditAction.ACTION_INDICATOR_UPDATED,
        auditDeleteAction: AuditAction.ACTION_INDICATOR_DELETED,
        auditEntityType: AuditEntityType.ACTION_INDICATOR,
        sortableFields: ["code", "statisticalCode", "name", "sequenceNumber", "plannedQuantity", "executionCut", "compliancePercentage", "unitMeasure.name"],
        defaultSortBy: "code",
        findOneRelations: ["unitMeasure"],
    };

    constructor(
        @InjectRepository(ActionPlanIndicator)
        protected readonly indicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(UnitMeasure)
        private readonly unitMeasureRepository: Repository<UnitMeasure>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }

    protected getPaginatedQueryCustomization(): PaginatedQueryCustomization {
        return {
            applyJoins(qb) {
                qb.leftJoin("i.unitMeasure", "unitMeasure")
                    .addSelect(["i", "unitMeasure.id", "unitMeasure.name"]);
            },
            applySearchConditions(qb, search) {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.description ILIKE :search", { search: `%${search}%` })
                    .orWhere("unitMeasure.name ILIKE :search", { search: `%${search}%` });
            },
        };
    }
}
