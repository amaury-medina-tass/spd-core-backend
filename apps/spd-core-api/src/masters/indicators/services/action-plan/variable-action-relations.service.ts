import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { VariableActionRelation } from "../../entities/action-plan/variable-action-relation.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { Variable } from "../../../variables/entities/variable.entity";

@Injectable()
export class VariableActionRelationsService {
    private readonly logger = new Logger(VariableActionRelationsService.name);

    constructor(
        @InjectRepository(VariableActionRelation)
        private readonly variableActionRelationRepository: Repository<VariableActionRelation>,
        @InjectRepository(ActionPlanIndicator)
        private readonly actionPlanIndicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(Variable)
        private readonly variableRepository: Repository<Variable>,
        private readonly auditLog: AuditLogService,
    ) { }

    async associate(indicatorId: string, variableId: string): Promise<VariableActionRelation> {
        await this.ensureIndicatorExists(indicatorId);

        try {
            const relation = this.variableActionRelationRepository.create({
                variableId,
                indicatorId,
            });
            const saved = await this.variableActionRelationRepository.save(relation);

            const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId }, select: ["id", "code", "name"] });
            const variable = await this.variableRepository.findOne({ where: { id: variableId }, select: ["id", "code", "name"] });

            await this.auditLog.logSuccess(AuditAction.VARIABLE_ACTION_RELATION_ASSOCIATED, AuditEntityType.VARIABLE_ACTION_RELATION, saved.id, {
                entityName: `${indicator?.code ?? indicatorId} - ${variable?.code ?? variableId}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId, variableId },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async disassociate(indicatorId: string, variableId: string): Promise<void> {
        const relation = await this.variableActionRelationRepository.findOne({
            where: { variableId, indicatorId },
        });

        if (!relation) {
            throw new NotFoundException({ message: `Relation between Indicator ${indicatorId} and Variable ${variableId} not found`, code: ErrorCodes.VARIABLE_INDICATOR_RELATION_NOT_FOUND });
        }

        const relationId = relation.id;
        await this.variableActionRelationRepository.remove(relation);

        const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId }, select: ["id", "code", "name"] });
        const variable = await this.variableRepository.findOne({ where: { id: variableId }, select: ["id", "code", "name"] });

        await this.auditLog.logSuccess(AuditAction.VARIABLE_ACTION_RELATION_DISASSOCIATED, AuditEntityType.VARIABLE_ACTION_RELATION, relationId, {
            entityName: `${indicator?.code ?? indicatorId} - ${variable?.code ?? variableId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, variableId },
        });
    }

    async findPaginated(
        indicatorId: string,
        type: "associated" | "available" | "all" = "all",
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        await this.ensureIndicatorExists(indicatorId);
        const skip = (page - 1) * limit;

        const associatedIds = (await this.variableActionRelationRepository.find({
            where: { indicatorId },
            select: ["variableId"]
        })).map(r => r.variableId);

        const query = this.variableRepository.createQueryBuilder("variable");

        if (type === "associated") {
            if (associatedIds.length === 0) {
                return this.emptyPaginatedResponse(page, limit);
            }
            query.where("variable.id IN (:...ids)", { ids: associatedIds });
        } else if (type === "available") {
            if (associatedIds.length > 0) {
                query.where("variable.id NOT IN (:...ids)", { ids: associatedIds });
            }
        }

        if (search) {
            query.andWhere(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [data, total] = await query
            .orderBy("variable.code", "ASC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        const enrichedData = type === "all"
            ? data.map(item => ({ ...item, isAssociated: associatedIds.includes(item.id) }))
            : data;

        return {
            data: enrichedData,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    private async ensureIndicatorExists(indicatorId: string) {
        const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicator with id ${indicatorId} not found`, code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }
    }

    private emptyPaginatedResponse(page: number, limit: number) {
        return {
            data: [],
            meta: {
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("The variable is already associated with this indicator.");
        }
        this.logger.error(error);
    }
}
