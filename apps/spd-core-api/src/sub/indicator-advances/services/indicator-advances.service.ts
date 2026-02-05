import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { IndicatorAdvance } from "../entities/indicator-advance.entity";

import { IndicativePlanIndicator } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../../masters/indicators/entities/action-plan/action-plan-indicator.entity";
import { ActionPlanIndicatorGoal } from "../../../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { IndicativePlanIndicatorGoal } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { VariableActionRelation } from "../../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { Variable } from "../../../masters/variables/entities/variable.entity";
import { VariableGoal } from "../../../masters/variables/entities/variable-goal.entity";
import { VariableAdvance } from "../../variable-advances/entities/variable-advance.entity";
import { VariableContextualAccumulator } from "../../variable-advances/entities/variable-contextual-accumulator.entity";
import {
    IndicatorDetailsResponseDto,
    IndicatorDto,
    IndicatorGoalDto,
    IndicatorAdvanceDto,
    VariableWithDetailsDto,
    VariableDto,
    VariableGoalDto,
    VariableAdvanceDto
} from "../dtos/indicator-details-response.dto";

@Injectable()
export class IndicatorAdvancesService {
    private readonly logger = new Logger(IndicatorAdvancesService.name);

    constructor(
        @InjectRepository(IndicatorAdvance)
        private readonly repository: Repository<IndicatorAdvance>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicativeRepo: Repository<IndicativePlanIndicator>,
        @InjectRepository(ActionPlanIndicator)
        private readonly actionRepo: Repository<ActionPlanIndicator>,
        @InjectRepository(ActionPlanIndicatorGoal)
        private readonly actionGoalRepo: Repository<ActionPlanIndicatorGoal>,
        @InjectRepository(IndicativePlanIndicatorGoal)
        private readonly indicativeGoalRepo: Repository<IndicativePlanIndicatorGoal>,
        @InjectRepository(VariableActionRelation)
        private readonly variableActionRelationRepo: Repository<VariableActionRelation>,
        @InjectRepository(VariableIndicativeRelation)
        private readonly variableIndicativeRelationRepo: Repository<VariableIndicativeRelation>,
        @InjectRepository(Variable)
        private readonly variableRepo: Repository<Variable>,
        @InjectRepository(VariableGoal)
        private readonly variableGoalRepo: Repository<VariableGoal>,
        @InjectRepository(VariableAdvance)
        private readonly variableAdvanceRepo: Repository<VariableAdvance>,
        @InjectRepository(VariableContextualAccumulator)
        private readonly variableContextualAccumulatorRepo: Repository<VariableContextualAccumulator>,
        private readonly auditLog: AuditLogService,
    ) { }

    async createOrUpdate(
        indicatorId: string,
        type: 'action' | 'indicative',
        year: number,
        month: number | null,
        value: number,
        manager?: any // Optional Transaction Manager
    ) {
        const repo = manager ? manager.getRepository(IndicatorAdvance) : this.repository;

        // Use IsNull() or explicit query for correct null matching
        const qb = repo.createQueryBuilder("ia")
            .where("ia.year = :year", { year });

        if (month !== null && month !== undefined) {
            qb.andWhere("ia.month = :month", { month });
        } else {
            qb.andWhere("ia.month IS NULL");
        }

        if (type === 'action') {
            qb.andWhere("ia.actionIndicatorId = :indicatorId", { indicatorId });
        } else {
            qb.andWhere("ia.indicativeIndicatorId = :indicatorId", { indicatorId });
        }

        let advance = await qb.getOne();

        const isNew = !advance;

        if (!advance) {
            advance = repo.create({
                year,
                month,
                value,
                actionIndicatorId: type === 'action' ? indicatorId : null,
                indicativeIndicatorId: type === 'indicative' ? indicatorId : null,
            });
        } else {
            advance.value = value;
        }

        const saved = await repo.save(advance);

        await this.auditLog.logSuccess(
            isNew ? AuditAction.INDICATOR_ADVANCE_CREATED : AuditAction.INDICATOR_ADVANCE_UPDATED,
            AuditEntityType.INDICATOR_ADVANCE,
            saved.id,
            {
                entityName: `${type} indicator ${indicatorId} - ${year}/${month}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId, type, year, month, value },
            },
        );

        // Update Parent Cache
        await this.updateParentCache(indicatorId, type, manager);

        return saved;
    }

    async getIndicatorDetails(
        indicatorId: string,
        type: 'action' | 'indicative',
        year?: number | 'all',
        month?: number | 'all'
    ): Promise<IndicatorDetailsResponseDto> {
        // Normalize filters: undefined, 'all', or empty means "all"
        const yearFilter = (year !== undefined && year !== 'all') ? year : null;
        const monthFilter = (month !== undefined && month !== 'all') ? month : null;
        // 1. Fetch and validate indicator
        let indicator: ActionPlanIndicator | IndicativePlanIndicator | null;
        if (type === 'action') {
            indicator = await this.actionRepo.findOne({
                where: { id: indicatorId },
                relations: ['unitMeasure']
            });
        } else {
            indicator = await this.indicativeRepo.findOne({
                where: { id: indicatorId },
                relations: ['unitMeasure']
            });
        }

        if (!indicator) {
            throw new NotFoundException({ message: `Indicator with ID ${indicatorId} not found`, code: ErrorCodes.INDICATOR_ADVANCE_NOT_FOUND });
        }

        // 2. Fetch indicator goals (filter by year if specified)
        const goalRepo = type === 'action' ? this.actionGoalRepo : this.indicativeGoalRepo;
        const goalWhereClause: any = { indicatorId };
        if (yearFilter !== null) {
            goalWhereClause.year = yearFilter;
        }
        const goals = await goalRepo.find({
            where: goalWhereClause,
        });

        // 3. Fetch indicator advances (filter by year and/or month if specified)
        const advancesQueryBuilder = this.repository.createQueryBuilder('ia');

        if (type === 'action') {
            advancesQueryBuilder.where('ia.actionIndicatorId = :indicatorId', { indicatorId });
        } else {
            advancesQueryBuilder.where('ia.indicativeIndicatorId = :indicatorId', { indicatorId });
        }

        if (yearFilter !== null) {
            advancesQueryBuilder.andWhere('ia.year = :year', { year: yearFilter });
        }

        if (monthFilter !== null) {
            advancesQueryBuilder.andWhere('ia.month = :month', { month: monthFilter });
        }

        const advances = await advancesQueryBuilder.getMany();

        // 4. Fetch related variables
        const relationRepo = type === 'action'
            ? this.variableActionRelationRepo
            : this.variableIndicativeRelationRepo;

        const relations = await relationRepo.find({
            where: { indicatorId },
            relations: ['variable']
        });

        // 5. For each variable, fetch goals and advances
        const variablesWithDetails: VariableWithDetailsDto[] = [];

        for (const relation of relations) {
            const variable = relation.variable;

            // Fetch variable goals (filter by year if specified)
            const varGoalWhere: any = { variableId: variable.id };
            if (yearFilter !== null) {
                varGoalWhere.year = yearFilter;
            }
            const variableGoals = await this.variableGoalRepo.find({
                where: varGoalWhere,
            });

            // Fetch variable advances (filter by year and/or month if specified)
            const variableAdvancesQuery = this.variableAdvanceRepo.createQueryBuilder('va')
                .where('va.variableId = :variableId', { variableId: variable.id });

            if (yearFilter !== null) {
                variableAdvancesQuery.andWhere('va.year = :year', { year: yearFilter });
            }

            if (monthFilter !== null) {
                variableAdvancesQuery.andWhere('va.month = :month', { month: monthFilter });
            }

            const variableAdvances = await variableAdvancesQuery.getMany();

            // Fetch calculated contextual accumulator value
            let calculatedValue: number | null = null;
            let lastCalculationDate: Date | null = null;

            if (type === 'action') {
                const accumulator = await this.variableContextualAccumulatorRepo.findOne({
                    where: { actionRelationId: relation.id }
                });
                calculatedValue = accumulator?.calculatedValue ? Number(accumulator.calculatedValue) : null;
                lastCalculationDate = accumulator?.lastCalculationDate || null;
            } else {
                const accumulator = await this.variableContextualAccumulatorRepo.findOne({
                    where: { indicativeRelationId: relation.id }
                });
                calculatedValue = accumulator?.calculatedValue ? Number(accumulator.calculatedValue) : null;
                lastCalculationDate = accumulator?.lastCalculationDate || null;
            }

            // Map to DTOs
            const variableDto: VariableDto = {
                id: variable.id,
                name: variable.name,
                description: variable.code, // Using code as description since Variable doesn't have description field
                unitMeasure: undefined // Variable entity doesn't have direct unitMeasure relation
            };

            const variableGoalDtos: VariableGoalDto[] = variableGoals.map(goal => ({
                id: goal.id,
                year: goal.year,
                value: Number(goal.value)
            }));

            const variableAdvanceDtos: VariableAdvanceDto[] = variableAdvances.map(advance => ({
                id: advance.id,
                year: advance.year,
                month: advance.month,
                value: Number(advance.value),
                observations: advance.observations
            }));

            variablesWithDetails.push({
                variable: variableDto,
                goals: variableGoalDtos,
                advances: variableAdvanceDtos,
                calculatedValue,
                lastCalculationDate
            });
        }

        // 6. Fetch accumulated advance (latest by year, then by month)
        const accumulatedAdvanceQuery = this.repository.createQueryBuilder('ia');

        if (type === 'action') {
            accumulatedAdvanceQuery.where('ia.actionIndicatorId = :indicatorId', { indicatorId });
        } else {
            accumulatedAdvanceQuery.where('ia.indicativeIndicatorId = :indicatorId', { indicatorId });
        }

        accumulatedAdvanceQuery
            .orderBy('ia.year', 'DESC')
            .addOrderBy('ia.month', 'DESC', 'NULLS LAST')
            .limit(1);

        const latestAdvance = await accumulatedAdvanceQuery.getOne();

        const accumulatedAdvance: IndicatorAdvanceDto | null = latestAdvance ? {
            id: latestAdvance.id,
            year: latestAdvance.year,
            month: latestAdvance.month,
            value: Number(latestAdvance.value)
        } : null;

        // 7. Build and return response
        const indicatorDto: IndicatorDto = {
            id: indicator.id,
            code: indicator.code,
            name: indicator.name,
            description: indicator.description,
            unitMeasure: indicator.unitMeasure?.name,
            accumulatedAdvance
        };

        const indicatorGoalDtos: IndicatorGoalDto[] = goals.map(goal => ({
            id: goal.id,
            year: goal.year,
            value: Number(goal.value)
        }));

        const indicatorAdvanceDtos: IndicatorAdvanceDto[] = advances.map(advance => ({
            id: advance.id,
            year: advance.year,
            month: advance.month,
            value: Number(advance.value)
        }));

        return {
            indicator: indicatorDto,
            goals: indicatorGoalDtos,
            advances: indicatorAdvanceDtos,
            variables: variablesWithDetails
        };
    }

    private async updateParentCache(indicatorId: string, type: 'action' | 'indicative', manager?: any) {
        // Calculate Sum
        const repo = manager ? manager.getRepository(IndicatorAdvance) : this.repository;

        const sumResult = await repo.createQueryBuilder("ia")
            .select("SUM(ia.value)", "total")
            .where(type === 'action' ? "ia.actionIndicatorId = :indicatorId" : "ia.indicativeIndicatorId = :indicatorId", { indicatorId })
            .getRawOne();

        const total = parseFloat(sumResult?.total || "0");
        this.logger.log(`Updated Cache for ${type} indicator ${indicatorId}: ${total}`);

        if (type === 'action') {
            const actionRepo = manager ? manager.getRepository(ActionPlanIndicator) : this.actionRepo;
            await actionRepo.update(indicatorId, { compliancePercentage: total });
        } else {
            const indicativeRepo = manager ? manager.getRepository(IndicativePlanIndicator) : this.indicativeRepo;
            await indicativeRepo.update(indicatorId, { advancePercentage: total });
        }
    }
}
