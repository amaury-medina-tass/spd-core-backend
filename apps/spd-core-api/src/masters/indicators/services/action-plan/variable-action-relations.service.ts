import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
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
    ) { }

    async associate(indicatorId: string, variableId: string): Promise<VariableActionRelation> {
        await this.ensureIndicatorExists(indicatorId);

        try {
            const relation = this.variableActionRelationRepository.create({
                variableId,
                indicatorId,
            });
            return await this.variableActionRelationRepository.save(relation);
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
            throw new NotFoundException(`Relation between Indicator ${indicatorId} and Variable ${variableId} not found`);
        }

        await this.variableActionRelationRepository.remove(relation);
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
            throw new NotFoundException(`Indicator with id ${indicatorId} not found`);
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
