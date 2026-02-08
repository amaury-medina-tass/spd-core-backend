import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, In, Repository } from "typeorm";
import { IndicativePlanIndicator } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../masters/indicators/entities/action-plan/action-plan-indicator.entity";
import { IndicativeIndicatorUser } from "../../masters/indicators/entities/indicative-plan/indicative-indicator-user.entity";
import { ActionIndicatorUser } from "../../masters/indicators/entities/action-plan/action-indicator-user.entity";
import { Variable } from "../../masters/variables/entities/variable.entity";
import { VariableUser } from "../../masters/variables/entities/variable-user.entity";

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

    async getIndicativeIndicatorsByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        // Get indicator IDs assigned to this user
        const assignments = await this.indicativeUserRepo.find({ where: { userId }, select: ["indicatorId"] });
        const indicatorIds = assignments.map(a => a.indicatorId);

        if (indicatorIds.length === 0) {
            return this.emptyPaginatedResponse(page, limit);
        }

        const sortableFields = ["code", "name", "programName", "pillarName", "componentName", "indicatorType.name", "unitMeasure.name", "direction.name"];
        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "code";

        const queryBuilder = this.indicativeRepo.createQueryBuilder("i")
            .leftJoin("i.indicatorType", "indicatorType")
            .leftJoin("i.unitMeasure", "unitMeasure")
            .leftJoin("i.direction", "direction")
            .addSelect(["i", "indicatorType.id", "indicatorType.name", "unitMeasure.id", "unitMeasure.name", "direction.id", "direction.name"])
            .where("i.id IN (:...indicatorIds)", { indicatorIds });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.programName ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`i.${validSortBy}`, validSortOrder);
        }

        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
        };
    }

    async getActionIndicatorsByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const assignments = await this.actionUserRepo.find({ where: { userId }, select: ["indicatorId"] });
        const indicatorIds = assignments.map(a => a.indicatorId);

        if (indicatorIds.length === 0) {
            return this.emptyPaginatedResponse(page, limit);
        }

        const sortableFields = ["code", "statisticalCode", "name", "sequenceNumber", "plannedQuantity", "executionCut", "compliancePercentage", "unitMeasure.name"];
        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "code";

        const queryBuilder = this.actionRepo.createQueryBuilder("i")
            .leftJoin("i.unitMeasure", "unitMeasure")
            .addSelect(["i", "unitMeasure.id", "unitMeasure.name"])
            .where("i.id IN (:...indicatorIds)", { indicatorIds });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.description ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`i.${validSortBy}`, validSortOrder);
        }

        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
        };
    }

    async getVariablesByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const assignments = await this.variableUserRepo.find({ where: { userId }, select: ["variableId"] });
        const variableIds = assignments.map(a => a.variableId);

        if (variableIds.length === 0) {
            return this.emptyPaginatedResponse(page, limit);
        }

        const sortableFields = ["createAt", "updateAt", "code", "name", "observations"];
        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.variableRepo.createQueryBuilder("variable")
            .select(["variable"])
            .where("variable.id IN (:...variableIds)", { variableIds });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.observations ILIKE :search", { search: `%${search}%` });
            }));
        }

        queryBuilder.orderBy(`variable.${validSortBy}`, validSortOrder);
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
        };
    }

    private emptyPaginatedResponse(page: number, limit: number) {
        return {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        };
    }
}
