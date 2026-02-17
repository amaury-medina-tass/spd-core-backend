import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { IndicatorType } from "../../entities/common/indicator-type.entity";
import { UnitMeasure } from "../../entities/common/unit-measure.entity";
import { IndicatorDirection } from "../../entities/common/indicator-direction.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { BasePlanIndicatorsService, PlanIndicatorsConfig, PaginatedQueryCustomization } from "../base";

@Injectable()
export class IndicativePlanIndicatorsService extends BasePlanIndicatorsService<IndicativePlanIndicator> {
    protected readonly logger = new Logger(IndicativePlanIndicatorsService.name);
    protected readonly config: PlanIndicatorsConfig = {
        alreadyExistsCode: ErrorCodes.INDICATIVE_INDICATOR_ALREADY_EXISTS,
        notFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
        auditCreateAction: AuditAction.INDICATIVE_INDICATOR_CREATED,
        auditUpdateAction: AuditAction.INDICATIVE_INDICATOR_UPDATED,
        auditDeleteAction: AuditAction.INDICATIVE_INDICATOR_DELETED,
        auditEntityType: AuditEntityType.INDICATIVE_INDICATOR,
        sortableFields: ["code", "name", "programName", "pillarName", "componentName", "indicatorType.name", "unitMeasure.name", "direction.name"],
        defaultSortBy: "code",
        findOneRelations: ["indicatorType", "unitMeasure", "direction"],
    };

    constructor(
        @InjectRepository(IndicativePlanIndicator)
        protected readonly indicatorRepository: Repository<IndicativePlanIndicator>,
        @InjectRepository(IndicatorType)
        private readonly indicatorTypeRepository: Repository<IndicatorType>,
        @InjectRepository(UnitMeasure)
        private readonly unitMeasureRepository: Repository<UnitMeasure>,
        @InjectRepository(IndicatorDirection)
        private readonly indicatorDirectionRepository: Repository<IndicatorDirection>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }

    protected getPaginatedQueryCustomization(): PaginatedQueryCustomization {
        return {
            applyJoins(qb) {
                qb.leftJoin("i.indicatorType", "indicatorType")
                    .leftJoin("i.unitMeasure", "unitMeasure")
                    .leftJoin("i.direction", "direction")
                    .addSelect(["i", "indicatorType.id", "indicatorType.name", "unitMeasure.id", "unitMeasure.name", "direction.id", "direction.name"]);
            },
            applySearchConditions(qb, search) {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.programName ILIKE :search", { search: `%${search}%` })
                    .orWhere("indicatorType.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("unitMeasure.name ILIKE :search", { search: `%${search}%` });
            },
        };
    }

    async getCatalogs() {
        const [indicatorTypes, unitMeasures, indicatorDirections] = await Promise.all([
            this.indicatorTypeRepository.find({ order: { name: "ASC" } }),
            this.unitMeasureRepository.find({ order: { name: "ASC" } }),
            this.indicatorDirectionRepository.find({ order: { name: "ASC" } }),
        ]);

        return { indicatorTypes, unitMeasures, indicatorDirections };
    }
}
