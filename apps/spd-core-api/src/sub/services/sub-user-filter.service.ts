import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import { IndicativePlanIndicator } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../masters/indicators/entities/action-plan/action-plan-indicator.entity";
import { IndicativeIndicatorUser } from "../../masters/indicators/entities/indicative-plan/indicative-indicator-user.entity";
import { ActionIndicatorUser } from "../../masters/indicators/entities/action-plan/action-indicator-user.entity";
import { Variable } from "../../masters/variables/entities/variable.entity";
import { VariableUser } from "../../masters/variables/entities/variable-user.entity";
import { calculateSkip, validateSortParams, applyOrderBy, buildPaginatedMeta, emptyPaginatedResponse } from "../../shared/helpers";

interface UserFilterConfig<T> {
    entityIds: string[];
    repo: Repository<T>;
    alias: string;
    sortableFields: string[];
    defaultSort?: string;
    buildQuery: (qb: SelectQueryBuilder<T>, ids: string[]) => void;
    applySearch: (qb: SelectQueryBuilder<T>, search: string) => void;
}

@Injectable()
export class SubUserFilterService {

    constructor(
        @InjectRepository(IndicativeIndicatorUser)
        private readonly indicativeUserRepo: Repository<IndicativeIndicatorUser>,
        @InjectRepository(ActionIndicatorUser)
        private readonly actionUserRepo: Repository<ActionIndicatorUser>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicativeRepo: Repository<IndicativePlanIndicator>,
        @InjectRepository(ActionPlanIndicator)
        private readonly actionRepo: Repository<ActionPlanIndicator>,
        @InjectRepository(VariableUser)
        private readonly variableUserRepo: Repository<VariableUser>,
        @InjectRepository(Variable)
        private readonly variableRepo: Repository<Variable>,
    ) { }

    private async findFilteredByUser<T>(
        config: UserFilterConfig<T>,
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        if (config.entityIds.length === 0) {
            return emptyPaginatedResponse(page, limit);
        }

        const skip = calculateSkip(page, limit);
        const { validSortBy, validSortOrder } = validateSortParams(sortBy, sortOrder, config.sortableFields, config.defaultSort);

        const queryBuilder = config.repo.createQueryBuilder(config.alias);
        config.buildQuery(queryBuilder, config.entityIds);

        if (search) {
            config.applySearch(queryBuilder, search);
        }

        applyOrderBy(queryBuilder, config.alias, validSortBy, validSortOrder);
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, meta: buildPaginatedMeta(total, page, limit) };
    }

    async getIndicativeIndicatorsByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        const assignments = await this.indicativeUserRepo.find({ where: { userId }, select: ["indicatorId"] });

        return this.findFilteredByUser(
            {
                entityIds: assignments.map(a => a.indicatorId),
                repo: this.indicativeRepo,
                alias: "i",
                sortableFields: ["code", "name", "programName", "pillarName", "componentName", "indicatorType.name", "unitMeasure.name", "direction.name"],
                defaultSort: "code",
                buildQuery: (qb, ids) => {
                    qb.leftJoin("i.indicatorType", "indicatorType")
                        .leftJoin("i.unitMeasure", "unitMeasure")
                        .leftJoin("i.direction", "direction")
                        .addSelect(["i", "indicatorType.id", "indicatorType.name", "unitMeasure.id", "unitMeasure.name", "direction.id", "direction.name"])
                        .where("i.id IN (:...ids)", { ids });
                },
                applySearch: (qb, s) => {
                    qb.andWhere(new Brackets((sub) => {
                        sub.where("i.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("i.name ILIKE :search", { search: `%${s}%` })
                            .orWhere("i.programName ILIKE :search", { search: `%${s}%` });
                    }));
                },
            },
            page, limit, search, sortBy, sortOrder,
        );
    }

    async getActionIndicatorsByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        const assignments = await this.actionUserRepo.find({ where: { userId }, select: ["indicatorId"] });

        return this.findFilteredByUser(
            {
                entityIds: assignments.map(a => a.indicatorId),
                repo: this.actionRepo,
                alias: "i",
                sortableFields: ["code", "statisticalCode", "name", "sequenceNumber", "plannedQuantity", "executionCut", "compliancePercentage", "unitMeasure.name"],
                defaultSort: "code",
                buildQuery: (qb, ids) => {
                    qb.leftJoin("i.unitMeasure", "unitMeasure")
                        .addSelect(["i", "unitMeasure.id", "unitMeasure.name"])
                        .where("i.id IN (:...ids)", { ids });
                },
                applySearch: (qb, s) => {
                    qb.andWhere(new Brackets((sub) => {
                        sub.where("i.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("i.name ILIKE :search", { search: `%${s}%` })
                            .orWhere("i.description ILIKE :search", { search: `%${s}%` });
                    }));
                },
            },
            page, limit, search, sortBy, sortOrder,
        );
    }

    async getVariablesByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        const assignments = await this.variableUserRepo.find({ where: { userId }, select: ["variableId"] });

        return this.findFilteredByUser(
            {
                entityIds: assignments.map(a => a.variableId),
                repo: this.variableRepo,
                alias: "variable",
                sortableFields: ["createAt", "updateAt", "code", "name", "observations"],
                buildQuery: (qb, ids) => {
                    qb.select(["variable"])
                        .where("variable.id IN (:...ids)", { ids });
                },
                applySearch: (qb, s) => {
                    qb.andWhere(new Brackets((sub) => {
                        sub.where("variable.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("variable.name ILIKE :search", { search: `%${s}%` })
                            .orWhere("variable.observations ILIKE :search", { search: `%${s}%` });
                    }));
                },
            },
            page, limit, search, sortBy, sortOrder,
        );
    }
}
