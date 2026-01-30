import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, DataSource, Repository } from "typeorm";
import { CreateVariableAdvanceDto } from "../dtos/create-variable-advance.dto";
import { VariableAdvance } from "../entities/variable-advance.entity";
import { VariableContextualAccumulator } from "../entities/variable-contextual-accumulator.entity";
import { AstEvaluatorService, EvaluationContext } from "./ast-evaluator.service";
import { Formula } from "../../../masters/indicators/entities/formula.entity";
import { VariableGoal } from "../../../masters/variables/entities/variable-goal.entity";
import { VariableIndicativeRelation } from "../../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { VariableActionRelation } from "../../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableQuadrennium } from "../../../masters/variables/entities/variable-quadrennium.entity";

// Placeholder imports for Goal repositories - assuming generic approach or direct query
import { IndicativePlanIndicator } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
// Assuming there is a goal entity for indicators, e.g. IndicativePlanIndicatorGoal
// If not available in immediate context, we might need to query dynamically or add imports.
// For now, I'll use raw queries or assume standard goal entities exist.
// Checking previous file list: `entities/indicative-plan/indicative-plan-indicator-goal.entity.ts` exists.
import { IndicativePlanIndicatorGoal } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { ActionPlanIndicatorGoal } from "../../../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { IndicatorAdvancesService } from "../../indicator-advances/services/indicator-advances.service";

@Injectable()
export class VariableAdvancesService {
    private readonly logger = new Logger(VariableAdvancesService.name);

    constructor(
        @InjectRepository(VariableAdvance)
        private readonly variableAdvanceRepository: Repository<VariableAdvance>,
        @InjectRepository(VariableContextualAccumulator)
        private readonly contextualAccumulatorRepository: Repository<VariableContextualAccumulator>,
        @InjectRepository(Formula)
        private readonly formulaRepository: Repository<Formula>,
        @InjectRepository(VariableGoal)
        private readonly variableGoalRepository: Repository<VariableGoal>,
        @InjectRepository(VariableIndicativeRelation)
        private readonly variableIndicativeRelationRepository: Repository<VariableIndicativeRelation>,
        @InjectRepository(VariableActionRelation)
        private readonly variableActionRelationRepository: Repository<VariableActionRelation>,
        @InjectRepository(VariableQuadrennium)
        private readonly variableQuadrenniumRepository: Repository<VariableQuadrennium>,
        @InjectRepository(IndicativePlanIndicatorGoal)
        private readonly indicativeGoalRepository: Repository<IndicativePlanIndicatorGoal>,
        @InjectRepository(ActionPlanIndicatorGoal)
        private readonly actionGoalRepository: Repository<ActionPlanIndicatorGoal>,
        private readonly astEvaluator: AstEvaluatorService,
        private readonly indicatorAdvancesService: IndicatorAdvancesService,
        private readonly dataSource: DataSource,
    ) { }

    async create(createDto: CreateVariableAdvanceDto): Promise<VariableAdvance> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create Advance
            const variableAdvance = this.variableAdvanceRepository.create(createDto);
            const savedAdvance = await queryRunner.manager.save(VariableAdvance, variableAdvance);

            // 2. Trigger Calculation
            this.logger.log(`Advance created for variable ${savedAdvance.variableId}. Triggering contextual calculation...`);
            await this.calculateContextualAccumulators(savedAdvance.variableId, savedAdvance.year, savedAdvance.month, queryRunner.manager);
            this.logger.log(`Contextual calculation completed for variable ${savedAdvance.variableId}.`);

            await queryRunner.commitTransaction();
            return savedAdvance;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.handleDBExceptions(error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async calculateContextualAccumulators(variableId: string, year: number, month: number, manager: any) { // Using any for EntityManager to avoid type issues in this snippet
        // Find formulas referencing this variable
        const formulas = await this.formulaRepository
            .createQueryBuilder("formula")
            .where(`jsonb_path_exists(ast::jsonb, '$.** ? (@.value == :variableId)', '{"variableId": "${variableId}"}')`) // Safe parameter binding for jsonb_path_exists is tricky in TypeORM, using manual structure or trying simple replacement
            // Note: TypeORM might not support binding inside the json path string directly.
            // Using literal string construction for the path query is risky for SQL injection if variableId is user input, but it's a UUID here.
            // Better approach:
            .setParameters({ variableId }) // We can't easily bind inside the single quote string of jsonpath
            // Let's use the user's raw query style:
            .where(`jsonb_path_exists(ast::jsonb, '$.** ? (@.value == "${variableId}")')`)
            .getMany();

        this.logger.log(`Found ${formulas.length} formulas for variable ${variableId}`);

        for (const formula of formulas) {
            try {
                await this.processFormula(formula, variableId, manager, year, month);
            } catch (err) {
                this.logger.error(`Error processing formula ${formula.id} for variable ${variableId}`, err);
                // Continue with other formulas? Or fail? Usually fail safely or log.
            }
        }
    }

    /**
     * Calculates and updates contextual accumulators for a specific formula.
     * Use this when a formula is created or updated.
     */
    async recalculateForFormula(formula: Formula) {
        // Iterate over all variables involved in this formula to update their accumulators.
        // Since the formula AST might reference multiple variables or rely on goal/refs,
        // we ideally need a "triggering" variable context for the current evaluators design.
        // However, the `processFormula` logic currently builds a context around a `triggeringVariableId`.

        // Strategy: 
        // 1. Identify all variables referenced in the formula AST (or via relations if feasible).
        // 2. For each variable found, trigger `processFormula`.
        // Alternatively, if the formula evaluation inherently covers all variables via sub-formulas (which it seems to do now by iterating subFormulaResults),
        // we just need ONE valid context variable to start the process if the AST relies on `ref.value`.

        // BUT: if we use ANY variable as trigger, `context.variableId` will be set to that. 
        // AND `processFormula` saves results iterating `subFormulaResults`.
        // SO: We need to find at least one variable related to this indicator to kickstart evaluation,
        // OR better, iterate over ALL variables related to this indicator.

        // Let's find all variables related to the indicator of this formula.
        let variables: { variableId: string }[] = [];

        if (formula.indicativeIndicatorId) {
            variables = await this.variableIndicativeRelationRepository.find({
                where: { indicatorId: formula.indicativeIndicatorId },
                select: ["variableId"]
            });
        } else if (formula.actionIndicatorId) {
            variables = await this.variableActionRelationRepository.find({
                where: { indicatorId: formula.actionIndicatorId },
                select: ["variableId"]
            });
        }

        this.logger.log(`Recalculating formula ${formula.id} for ${variables.length} related variables.`);

        // Optimization: Formula evaluation might be constant for some parts, but context-dependent for `ref_advance` (defaults to ctx.variableId).
        // If the formula contains `ref` to other variables, those are calculated regardless of context variable?
        // Actually `processFormula` sets `ctx.variableId = triggeringVariableId`.
        // If the formula uses `ref_advance` without specific ID, it uses ctx.variableId.
        // So we MUST iterate over each variable to ensure it is evaluated as the "primary" context 
        // in case the formula intends to calculate for "the current variable".

        // However, `processFormula` iterates `subFormulaResults` to save everything.
        // If we run it for Var A, it might calculate Var B's subformula too.
        // If we then run it for Var B, it might calculate Var A's subformula.
        // This is redundancy but ensures correctness if the "main" value depends on "current" variable.

        // NOTE: If the formula is purely explicit (all IDs hardcoded), running once is enough.
        // But usually formulas are generic "myself + others".

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Fetch distinct years involved for these variables to recalculate history
            // This is expensive but necessary for consistency.
            // We can optimize by only picking years present in advances for these variables.
            const distinctYears = await this.variableAdvanceRepository.createQueryBuilder("va")
                .select("DISTINCT va.year", "year")
                .where("va.variableId IN (:...ids)", { ids: variables.map(v => v.variableId) })
                .getRawMany();

            const years = distinctYears.map(y => y.year);

            // Also include current year if not present? No, only where data exists matters usually.

            for (const v of variables) {
                for (const yObj of distinctYears) {
                    const year = yObj.year;
                    // Calculate for both Annual (month=null) and Monthly (1-12) contexts?
                    // Usually Action Plan is monthly, Indicative is Annual.
                    // If the formula is for Action Plan, we might need to iterate months too if the formula is monthly.
                    // But `processFormula` context logic tries to fetch specific if needed.
                    // If we pass `month=null`, it calculates Annual.
                    // If we pass `month=X`, it calculates Monthly.

                    // Strategy:
                    // If Action Indicator -> Iterate Months 1-12 + Annual?
                    // If Indicative Indicator -> Iterate Annual.

                    if (formula.actionIndicatorId) {
                        // Iterate months 1-12
                        for (let m = 1; m <= 12; m++) {
                            await this.processFormula(formula, v.variableId, queryRunner.manager, year, m);
                        }
                        // Also Annual? Usually Action Plan separates registers by month.
                    } else {
                        // Indicative -> Annual
                        await this.processFormula(formula, v.variableId, queryRunner.manager, year, null);
                    }
                }
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error recalculating formula ${formula.id}`, err);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async processFormula(formula: Formula, triggeringVariableId: string, manager: any, year?: number, month?: number | null) {
        this.logger.log(`Processing formula ${formula.id} for indicator (Ind: ${formula.indicativeIndicatorId} / Act: ${formula.actionIndicatorId})`);
        // Prepare Context
        const context: EvaluationContext = {
            variableId: triggeringVariableId,
            fetchAdvancesSum: async (varId: string, year: number | null, months: number[]) => {
                // Fetch sum of advances
                const qb = manager.createQueryBuilder(VariableAdvance, "va")
                    .select("SUM(va.value)", "total")
                    .where("va.variable_id = :varId", { varId });

                if (year) {
                    qb.andWhere("va.year = :year", { year });
                }

                if (months && months.length > 0) {
                    qb.andWhere("va.month IN (:...months)", { months });
                }

                const res = await qb.getRawOne();
                return parseFloat(res?.total || "0");
            },
            fetchIndicatorGoal: async (goalId) => {
                // Try indicative goal first
                const indGoal = await this.indicativeGoalRepository.findOne({ where: { id: goalId } });
                if (indGoal) return Number(indGoal.value); // Assuming value field exists

                // Try action goal
                const actGoal = await this.actionGoalRepository.findOne({ where: { id: goalId } });
                if (actGoal) return Number(actGoal.value);

                return 0;
            },
            goalValues: {}, // To be populated if formula uses goal_var
            subFormulaResults: {},
            year,
            month: month || undefined
        };

        // Populate Goal Values (goal_var) if needed
        // Optimization: finding all referenced goal_vars in formula AST
        // For now, simpler approach: If the AST hits a goal_var, it expects it in ctx.goalValues.
        // We can pre-fetch all goals for the triggering variable or referenced variables.
        // Given complexity, let's just fetch ALL VariableGoals for the known variableId (if formula implies it)
        // BUT formula might reference OTHER variables.
        // The AST Evaluator handles `goal_var` by looking up in `goalValues`.
        // If we want to support `goal_var`, we need to know WHICH variables are involved or fetch on demand.
        // The current AstEvaluatorService implementation expects `goalValues` map.
        // We really should change AstEvaluatorService to have a `fetchVariableGoal` delegate instead of a map.
        // BUT I can't change it right now easily without refactoring.
        // Let's pre-fetch goals for the *triggering* variable at least, assuming most formulas use that?
        // Actually, the AST node `goal_var` has `value` = UUID of the VARIABLE GOAL. 
        // So we can just fetch that distinct goal.
        // I will modify AstEvaluatorService to maybe accept a fetcher if I could, but wait, I can just populate the map?
        // No, I don't know the IDs beforehand without traversing AST.
        // OK, I'll update AstEvaluatorService to allow on-demand fetching for goal_var too, or quickly traverse AST here.
        // Or better: Update AstEvaluatorService to accept `fetchVariableGoal` delegate. This is cleaner.
        // I'll stick to the current service definition I made? 
        // "goalValues: Record<string, number>;" was in my service definition.
        // I will modify the Service to be more flexible if possible.
        // Actually I can't modify the service within this tool call.
        // I'll handle it by blindly fetching goals referenced? 
        // Re-reading AST Service: 
        // `if (goalVarId && ctx.goalValues[goalVarId] !== undefined) ...`
        // It requires the map.
        // I will do a quick regex search on the AST string to find likely UUIDs for goal_var? 
        // Or just `formula.ast` traverse.
        // Let's do a simple traversal to collect goal IDs.
        const referencedGoalIds = this.extractGoalVarIds(formula.ast);
        if (referencedGoalIds.length > 0) {
            const goals = await this.variableGoalRepository.createQueryBuilder("vg")
                .where("vg.id IN (:...ids)", { ids: referencedGoalIds })
                .getMany();
            goals.forEach(g => {
                context.goalValues[g.id] = Number(g.value);
                context.goalValues[g.id] = Number(g.value);
            });
        }

        const referencedQuadVarIds = this.extractQuadVarIds(formula.ast);
        if (referencedQuadVarIds.length > 0) {
            const quadrenniums = await this.variableQuadrenniumRepository.createQueryBuilder("vq")
                .where("vq.id IN (:...ids)", { ids: referencedQuadVarIds })
                .getMany();
            quadrenniums.forEach(q => {
                context.goalValues[q.id] = Number(q.value); // Reusing goalValues map for quad values too
            });
        }

        // Evaluate
        const resultValue = await this.astEvaluator.evaluate(formula.ast, context);

        // Save Main Indicator Advance Result
        if (year) {
            const indicatorId = formula.indicativeIndicatorId || formula.actionIndicatorId;
            const type = formula.indicativeIndicatorId ? 'indicative' : 'action';

            if (indicatorId) {
                await this.indicatorAdvancesService.createOrUpdate(
                    indicatorId,
                    type,
                    year,
                    month || null,
                    resultValue,
                    manager
                );
                this.logger.log(`Saved Indicator Advance: ${type} ${indicatorId} Year ${year} Month ${month} = ${resultValue}`);
            }
        }

        // Save Results
        // Iterate over ALL variables that had a sub-formula calculated in this context
        // and update their contextual accumulators for this indicator.

        for (const [varId, calculatedValue] of Object.entries(context.subFormulaResults)) {
            if (calculatedValue === undefined) continue;

            // Find Relation ID
            let indicativeRelId: string | undefined;
            let actionRelId: string | undefined;

            if (formula.indicativeIndicatorId) {
                const rel = await this.variableIndicativeRelationRepository.findOne({
                    where: { variableId: varId, indicatorId: formula.indicativeIndicatorId }
                });
                indicativeRelId = rel?.id;
            } else if (formula.actionIndicatorId) {
                const rel = await this.variableActionRelationRepository.findOne({
                    where: { variableId: varId, indicatorId: formula.actionIndicatorId }
                });
                actionRelId = rel?.id;
            }

            if (indicativeRelId || actionRelId) {
                // Upsert Accumulator
                const existing = await this.contextualAccumulatorRepository.findOne({
                    where: indicativeRelId ? { indicativeRelationId: indicativeRelId } : { actionRelationId: actionRelId }
                });

                const acc = existing || this.contextualAccumulatorRepository.create({
                    indicativeRelationId: indicativeRelId,
                    actionRelationId: actionRelId
                });

                acc.calculatedValue = calculatedValue;

                await manager.save(VariableContextualAccumulator, acc);
                this.logger.log(`Updated contextual accumulator for var ${varId} in formula ${formula.id}: ${calculatedValue}`);
            } else {
                this.logger.warn(`Relation not found for variable ${varId} and indicator in formula ${formula.id}`);
            }
        }
    }

    private extractGoalVarIds(node: any): string[] {
        const ids: string[] = [];
        if (!node) return ids;

        if (node.kind === "goal_var" && node.value) {
            ids.push(node.value);
        }

        if (node.left) ids.push(...this.extractGoalVarIds(node.left));
        if (node.right) ids.push(...this.extractGoalVarIds(node.right));
        if (node.args && Array.isArray(node.args)) {
            node.args.forEach((arg: any) => ids.push(...this.extractGoalVarIds(arg)));
        }
        if (node.subFormula) ids.push(...this.extractGoalVarIds(node.subFormula)); // Traverse subformulas too!

        return ids;
    }

    private extractQuadVarIds(node: any): string[] {
        const ids: string[] = [];
        if (!node) return ids;

        if (node.kind === "quad_var" && node.value) {
            ids.push(node.value);
        }

        if (node.left) ids.push(...this.extractQuadVarIds(node.left));
        if (node.right) ids.push(...this.extractQuadVarIds(node.right));
        if (node.args && Array.isArray(node.args)) {
            node.args.forEach((arg: any) => ids.push(...this.extractQuadVarIds(arg)));
        }
        if (node.subFormula) ids.push(...this.extractQuadVarIds(node.subFormula));

        return ids;
    }

    // ... (rest of service: findAllPaginated, findOne, etc.)
    async findAllPaginated(
        variableId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "year",
            "month",
            "value",
            "variable.code",
            "variable.name",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.variableAdvanceRepository
            .createQueryBuilder("va")
            .leftJoin("va.variable", "variable")
            .where("variable.id = :variableId", { variableId })
            .addSelect(["va"]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("va.year::text ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`va.${validSortBy}`, validSortOrder);
        }

        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string): Promise<VariableAdvance> {
        const variableAdvance = await this.variableAdvanceRepository.findOne({
            where: { id },
            relations: ["variable"]
        });

        if (!variableAdvance) {
            throw new NotFoundException(`Variable Advance with id ${id} not found`);
        }

        return variableAdvance;
    }

    async findAllByActionIndicator(indicatorId: string, year?: number) {
        // 1. Get Variables linked to this Action Indicator with their Contextual Accumulator
        const variablesData = await this.variableActionRelationRepository.createQueryBuilder("var")
            .innerJoinAndSelect("var.variable", "v")
            .leftJoinAndSelect(VariableContextualAccumulator, "vca", "vca.actionRelationId = var.id")
            .where("var.indicatorId = :indicatorId", { indicatorId })
            .select([
                "v.id",
                "v.name",
                "v.code",
                "vca.calculatedValue",
                "vca.lastCalculationDate",
                "var.id",
                "var.variableId",
                "var.indicatorId"
            ])
            .getRawMany();

        // 2. Fetch Advances for these variables
        if (variablesData.length === 0) {
            return [];
        }

        const variableIds = variablesData.map(v => v.v_id);

        const advancesQuery = this.variableAdvanceRepository.createQueryBuilder("va")
            .where("va.variableId IN (:...variableIds)", { variableIds });

        if (year) {
            advancesQuery.andWhere("va.year = :year", { year });
        }

        advancesQuery.orderBy("va.year", "ASC").addOrderBy("va.month", "ASC");

        const advances = await advancesQuery.getMany();

        // 3. Merge Data
        return variablesData.map(data => {
            const variableAdvances = advances.filter(a => a.variableId === data.v_id);
            return {
                variableId: data.v_id,
                variableName: data.v_name,
                variableCode: data.v_code,
                calculatedValue: data.vca_calculated_value ? parseFloat(data.vca_calculated_value) : null,
                lastCalculationDate: data.vca_last_calculation_date,
                actionRelationId: data.var_id,
                advances: variableAdvances
            };
        });
    }

    async findAllByIndicativeIndicator(indicatorId: string, year?: number) {
        // 1. Get Variables linked to this Indicative Indicator with their Contextual Accumulator
        const variablesData = await this.variableIndicativeRelationRepository.createQueryBuilder("vir")
            .innerJoinAndSelect("vir.variable", "v")
            .leftJoinAndSelect(VariableContextualAccumulator, "vca", "vca.indicativeRelationId = vir.id")
            .where("vir.indicatorId = :indicatorId", { indicatorId })
            .select([
                "v.id",
                "v.name",
                "v.code",
                "vca.calculatedValue",
                "vca.lastCalculationDate",
                "vir.id",
                "vir.variableId",
                "vir.indicatorId"
            ])
            .getRawMany();

        // 2. Fetch Advances for these variables
        if (variablesData.length === 0) {
            return [];
        }

        const variableIds = variablesData.map(v => v.v_id);

        const advancesQuery = this.variableAdvanceRepository.createQueryBuilder("va")
            .where("va.variableId IN (:...variableIds)", { variableIds });

        if (year) {
            advancesQuery.andWhere("va.year = :year", { year });
        }

        advancesQuery.orderBy("va.year", "ASC").addOrderBy("va.month", "ASC");

        const advances = await advancesQuery.getMany();

        // 3. Merge Data
        return variablesData.map(data => {
            const variableAdvances = advances.filter(a => a.variableId === data.v_id);
            return {
                variableId: data.v_id,
                variableName: data.v_name,
                variableCode: data.v_code,
                calculatedValue: data.vca_calculated_value ? parseFloat(data.vca_calculated_value) : null,
                lastCalculationDate: data.vca_last_calculation_date,
                indicativeRelationId: data.vir_id,
                advances: variableAdvances
            };
        });
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe un avance para esta variable en el periodo especificado");
        }
        this.logger.error(error);
    }
}

