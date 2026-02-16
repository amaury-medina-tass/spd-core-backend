import { Injectable, Logger, NotFoundException } from "@nestjs/common";
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

        if (advance) {
            advance.value = value;
        } else {
            advance = repo.create({
                year,
                month,
                value,
                actionIndicatorId: type === 'action' ? indicatorId : null,
                indicativeIndicatorId: type === 'indicative' ? indicatorId : null,
            });
        }

        const saved = await repo.save(advance);

        const indicator = type === 'action'
            ? await this.actionRepo.findOne({ where: { id: indicatorId }, select: ["code", "name"] })
            : await this.indicativeRepo.findOne({ where: { id: indicatorId }, select: ["code", "name"] });
        const indicatorLabel = indicator?.code ?? indicator?.name ?? indicatorId;

        await this.auditLog.logSuccess(
            isNew ? AuditAction.INDICATOR_ADVANCE_CREATED : AuditAction.INDICATOR_ADVANCE_UPDATED,
            AuditEntityType.INDICATOR_ADVANCE,
            saved.id,
            {
                entityName: `${indicatorLabel} - ${year}/${month}`,
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
        const indicator = await this.fetchIndicatorByType(indicatorId, type);

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
        const advances = await this.fetchFilteredAdvances(indicatorId, type, yearFilter, monthFilter);

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
            const details = await this.fetchVariableWithDetails(relation, type, yearFilter, monthFilter);
            variablesWithDetails.push(details);
        }

        // 6. Fetch accumulated advance
        const accumulatedAdvance = await this.fetchAccumulatedAdvance(indicatorId, type);

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

    private async fetchIndicatorByType(
        indicatorId: string, type: 'action' | 'indicative'
    ): Promise<ActionPlanIndicator | IndicativePlanIndicator | null> {
        const repo = type === 'action' ? this.actionRepo : this.indicativeRepo;
        return repo.findOne({ where: { id: indicatorId }, relations: ['unitMeasure'] });
    }

    private async fetchFilteredAdvances(
        indicatorId: string, type: 'action' | 'indicative',
        yearFilter: number | null, monthFilter: number | null
    ): Promise<IndicatorAdvance[]> {
        const qb = this.repository.createQueryBuilder('ia');
        const column = type === 'action' ? 'ia.actionIndicatorId' : 'ia.indicativeIndicatorId';
        qb.where(`${column} = :indicatorId`, { indicatorId });

        if (yearFilter !== null) {
            qb.andWhere('ia.year = :year', { year: yearFilter });
        }
        if (monthFilter !== null) {
            qb.andWhere('ia.month = :month', { month: monthFilter });
        }
        return qb.getMany();
    }

    private async fetchVariableWithDetails(
        relation: any,
        type: 'action' | 'indicative',
        yearFilter: number | null,
        monthFilter: number | null
    ): Promise<VariableWithDetailsDto> {
        const variable = relation.variable;

        // Fetch variable goals
        const varGoalWhere: any = { variableId: variable.id };
        if (yearFilter !== null) {
            varGoalWhere.year = yearFilter;
        }
        const variableGoals = await this.variableGoalRepo.find({ where: varGoalWhere });

        // Fetch variable advances
        const vaQuery = this.variableAdvanceRepo.createQueryBuilder('va')
            .where('va.variableId = :variableId', { variableId: variable.id });
        if (yearFilter !== null) {
            vaQuery.andWhere('va.year = :year', { year: yearFilter });
        }
        if (monthFilter !== null) {
            vaQuery.andWhere('va.month = :month', { month: monthFilter });
        }
        const variableAdvances = await vaQuery.getMany();

        // Fetch contextual accumulator
        const { calculatedValue, lastCalculationDate } = await this.fetchAccumulatorValues(relation, type);

        return {
            variable: {
                id: variable.id,
                name: variable.name,
                description: variable.code,
                unitMeasure: undefined
            },
            goals: variableGoals.map(g => ({ id: g.id, year: g.year, value: Number(g.value) })),
            advances: variableAdvances.map(a => ({
                id: a.id, year: a.year, month: a.month,
                value: Number(a.value), observations: a.observations
            })),
            calculatedValue,
            lastCalculationDate
        };
    }

    private async fetchAccumulatorValues(
        relation: any, type: 'action' | 'indicative'
    ): Promise<{ calculatedValue: number | null; lastCalculationDate: Date | null }> {
        const whereClause = type === 'action'
            ? { actionRelationId: relation.id }
            : { indicativeRelationId: relation.id };
        const accumulator = await this.variableContextualAccumulatorRepo.findOne({ where: whereClause });
        return {
            calculatedValue: accumulator?.calculatedValue ? Number(accumulator.calculatedValue) : null,
            lastCalculationDate: accumulator?.lastCalculationDate || null
        };
    }

    private async fetchAccumulatedAdvance(
        indicatorId: string, type: 'action' | 'indicative'
    ): Promise<IndicatorAdvanceDto | null> {
        const qb = this.repository.createQueryBuilder('ia');
        const column = type === 'action' ? 'ia.actionIndicatorId' : 'ia.indicativeIndicatorId';
        qb.where(`${column} = :indicatorId`, { indicatorId })
            .orderBy('ia.year', 'DESC')
            .addOrderBy('ia.month', 'DESC', 'NULLS LAST')
            .limit(1);
        const latestAdvance = await qb.getOne();
        if (!latestAdvance) return null;
        return {
            id: latestAdvance.id,
            year: latestAdvance.year,
            month: latestAdvance.month,
            value: Number(latestAdvance.value)
        };
    }

    private async updateParentCache(indicatorId: string, type: 'action' | 'indicative', manager?: any) {
        // Calculate Sum
        const repo = manager ? manager.getRepository(IndicatorAdvance) : this.repository;

        const sumResult = await repo.createQueryBuilder("ia")
            .select("SUM(ia.value)", "total")
            .where(type === 'action' ? "ia.actionIndicatorId = :indicatorId" : "ia.indicativeIndicatorId = :indicatorId", { indicatorId })
            .getRawOne();

        const total = Number.parseFloat(sumResult?.total || "0");
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
