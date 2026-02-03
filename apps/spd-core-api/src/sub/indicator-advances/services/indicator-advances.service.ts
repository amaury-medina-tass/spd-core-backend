import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

        // Update Parent Cache
        await this.updateParentCache(indicatorId, type, manager);

        return saved;
    }

    async getIndicatorDetails(
        indicatorId: string,
        type: 'action' | 'indicative',
        year: number,
        month?: number
    ): Promise<IndicatorDetailsResponseDto> {
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
            throw new NotFoundException(`Indicator with ID ${indicatorId} not found`);
        }

        // 2. Fetch indicator goals (filter by year if needed)
        const goalRepo = type === 'action' ? this.actionGoalRepo : this.indicativeGoalRepo;
        const goals = await goalRepo.find({
            where: { indicatorId, year },
        });

        // 3. Fetch indicator advances (filter by year and optionally month)
        const advancesQueryBuilder = this.repository.createQueryBuilder('ia')
            .where('ia.year = :year', { year });

        if (month !== undefined && month !== null) {
            advancesQueryBuilder.andWhere('ia.month = :month', { month });
        }

        if (type === 'action') {
            advancesQueryBuilder.andWhere('ia.actionIndicatorId = :indicatorId', { indicatorId });
        } else {
            advancesQueryBuilder.andWhere('ia.indicativeIndicatorId = :indicatorId', { indicatorId });
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

            // Fetch variable goals
            const variableGoals = await this.variableGoalRepo.find({
                where: { variableId: variable.id, year },
            });

            // Fetch variable advances
            const variableAdvancesQuery = this.variableAdvanceRepo.createQueryBuilder('va')
                .where('va.variableId = :variableId', { variableId: variable.id })
                .andWhere('va.year = :year', { year });

            if (month !== undefined && month !== null) {
                variableAdvancesQuery.andWhere('va.month = :month', { month });
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

        // 6. Build and return response
        const indicatorDto: IndicatorDto = {
            id: indicator.id,
            code: indicator.code,
            name: indicator.name,
            description: indicator.description,
            unitMeasure: indicator.unitMeasure?.name
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
            value: Number(advance.value),
            accumulatedValue: advance.accumulatedValue ? Number(advance.accumulatedValue) : null,
            observations: advance.observations,
            evidenceUrl: advance.evidenceUrl
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
