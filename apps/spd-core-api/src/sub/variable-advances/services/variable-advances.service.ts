import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, DataSource, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { CreateVariableAdvanceDto } from "../dtos/create-variable-advance.dto";
import { VariableAdvance } from "../entities/variable-advance.entity";
import { VariableContextualAccumulator } from "../entities/variable-contextual-accumulator.entity";
import { AstEvaluatorService, EvaluationContext } from "./ast-evaluator.service";
import { Formula } from "../../../masters/indicators/entities/formula.entity";
import { VariableGoal } from "../../../masters/variables/entities/variable-goal.entity";
import { VariableIndicativeRelation } from "../../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { VariableActionRelation } from "../../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableQuadrennium } from "../../../masters/variables/entities/variable-quadrennium.entity";
import { Variable } from "../../../masters/variables/entities/variable.entity";
import { VariableLocation } from "../../../masters/variables/entities/variable-location.entity";
import { VariableLocationResponseDto, VariableAdvancesWithLocationsResponseDto } from "../dtos/variable-location-response.dto";
import { VariableAdvanceCommune } from "../entities/variable-advance-commune.entity";

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
        @InjectRepository(VariableLocation)
        private readonly variableLocationRepository: Repository<VariableLocation>,
        @InjectRepository(VariableAdvanceCommune)
        private readonly variableAdvanceCommuneRepository: Repository<VariableAdvanceCommune>,
        private readonly astEvaluator: AstEvaluatorService,
        private readonly indicatorAdvancesService: IndicatorAdvancesService,
        private readonly dataSource: DataSource,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(createDto: CreateVariableAdvanceDto): Promise<VariableAdvance> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create Advance
            const variableAdvance = this.variableAdvanceRepository.create(createDto);
            const savedAdvance = await queryRunner.manager.save(VariableAdvance, variableAdvance);

            // 2. Save commune relations if provided
            if (createDto.communeIds && createDto.communeIds.length > 0) {
                const communeRelations = createDto.communeIds.map(communeId => 
                    queryRunner.manager.create(VariableAdvanceCommune, {
                        variableAdvanceId: savedAdvance.id,
                        communeId
                    })
                );
                await queryRunner.manager.save(VariableAdvanceCommune, communeRelations);
            }

            // 3. Trigger Calculation
            this.logger.log(`Advance created for variable ${savedAdvance.variableId}. Triggering contextual calculation...`);
            await this.calculateContextualAccumulators(savedAdvance.variableId, savedAdvance.year, savedAdvance.month, queryRunner.manager);
            this.logger.log(`Contextual calculation completed for variable ${savedAdvance.variableId}.`);

            await queryRunner.commitTransaction();

            const variable = await this.dataSource.getRepository(Variable).findOne({ where: { id: savedAdvance.variableId }, select: ["code"] });

            await this.auditLog.logSuccess(AuditAction.VARIABLE_ADVANCE_CREATED, AuditEntityType.VARIABLE_ADVANCE, savedAdvance.id, {
                entityName: `${variable?.code ?? savedAdvance.variableId} - ${savedAdvance.year}/${savedAdvance.month}`,
                system: SYSTEM_NAME,
                metadata: { 
                    variableId: savedAdvance.variableId, 
                    year: savedAdvance.year, 
                    month: savedAdvance.month, 
                    value: savedAdvance.value,
                    communeIds: createDto.communeIds 
                },
            });

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
        
        const baseline = await this.fetchFormulaBaseline(formula, manager);

        // Prepare Context
        const context: EvaluationContext = {
            variableId: triggeringVariableId,
            baseline,
            fetchAdvancesSum: (varId, yr, months) => this.fetchAdvancesSum(manager, varId, yr, months),
            fetchIndicatorGoal: (goalId) => this.fetchIndicatorGoalValue(goalId),
            goalValues: {},
            subFormulaResults: {},
            year,
            month: month || undefined
        };

        // Populate Goal and Quad Values
        await this.populateGoalAndQuadValues(formula, context);

        // Evaluate
        const resultValue = await this.astEvaluator.evaluate(formula.ast, context);

        // Save Main Indicator Advance Result
        await this.saveIndicatorAdvanceResult(formula, year, month, resultValue, manager);

        // Save Sub-Formula Results
        await this.saveSubFormulaResults(formula, context, manager);
    }

    private async fetchFormulaBaseline(formula: Formula, manager: any): Promise<number | undefined> {
        if (!formula.indicativeIndicatorId) return undefined;

        const indicator = await manager.findOne(IndicativePlanIndicator, {
            where: { id: formula.indicativeIndicatorId },
            select: ["baseline"]
        });
        if (!indicator?.baseline) return undefined;

        const parsed = Number.parseFloat(indicator.baseline.replace(",", "."));
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    private async fetchAdvancesSum(manager: any, varId: string, year: number | null, months: number[]): Promise<number> {
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
        return Number.parseFloat(res?.total || "0");
    }

    private async fetchIndicatorGoalValue(goalId: string): Promise<number> {
        const indGoal = await this.indicativeGoalRepository.findOne({ where: { id: goalId } });
        if (indGoal) return Number(indGoal.value);

        const actGoal = await this.actionGoalRepository.findOne({ where: { id: goalId } });
        if (actGoal) return Number(actGoal.value);

        return 0;
    }

    private async populateGoalAndQuadValues(formula: Formula, context: EvaluationContext): Promise<void> {
        const referencedGoalIds = this.extractGoalVarIds(formula.ast);
        if (referencedGoalIds.length > 0) {
            const goals = await this.variableGoalRepository.createQueryBuilder("vg")
                .where("vg.id IN (:...ids)", { ids: referencedGoalIds })
                .getMany();
            goals.forEach(g => {
                context.goalValues[g.id] = Number(g.value);
            });
        }

        const referencedQuadVarIds = this.extractQuadVarIds(formula.ast);
        if (referencedQuadVarIds.length > 0) {
            const quadrenniums = await this.variableQuadrenniumRepository.createQueryBuilder("vq")
                .where("vq.id IN (:...ids)", { ids: referencedQuadVarIds })
                .getMany();
            quadrenniums.forEach(q => {
                context.goalValues[q.id] = Number(q.value);
            });
        }
    }

    private async saveIndicatorAdvanceResult(
        formula: Formula, year: number | undefined, month: number | null | undefined,
        resultValue: number, manager: any
    ): Promise<void> {
        if (!year) return;

        const indicatorId = formula.indicativeIndicatorId || formula.actionIndicatorId;
        const type = formula.indicativeIndicatorId ? 'indicative' : 'action';

        if (!indicatorId) return;

        await this.indicatorAdvancesService.createOrUpdate(
            indicatorId, type, year, month || null, resultValue, manager
        );
        this.logger.log(`Saved Indicator Advance: ${type} ${indicatorId} Year ${year} Month ${month} = ${resultValue}`);
    }

    private async saveSubFormulaResults(formula: Formula, context: EvaluationContext, manager: any): Promise<void> {
        for (const [varId, calculatedValue] of Object.entries(context.subFormulaResults)) {
            if (calculatedValue === undefined) continue;
            await this.upsertContextualAccumulator(formula, varId, calculatedValue, manager);
        }
    }

    private async upsertContextualAccumulator(
        formula: Formula, varId: string, calculatedValue: number, manager: any
    ): Promise<void> {
        const { indicativeRelId, actionRelId } = await this.findRelationIds(formula, varId);

        if (!indicativeRelId && !actionRelId) {
            this.logger.warn(`Relation not found for variable ${varId} and indicator in formula ${formula.id}`);
            return;
        }

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
    }

    private async findRelationIds(
        formula: Formula, varId: string
    ): Promise<{ indicativeRelId?: string; actionRelId?: string }> {
        if (formula.indicativeIndicatorId) {
            const rel = await this.variableIndicativeRelationRepository.findOne({
                where: { variableId: varId, indicatorId: formula.indicativeIndicatorId }
            });
            return { indicativeRelId: rel?.id };
        }
        if (formula.actionIndicatorId) {
            const rel = await this.variableActionRelationRepository.findOne({
                where: { variableId: varId, indicatorId: formula.actionIndicatorId }
            });
            return { actionRelId: rel?.id };
        }
        return {};
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
            throw new NotFoundException({ message: `Variable Advance with id ${id} not found`, code: ErrorCodes.VARIABLE_ADVANCE_NOT_FOUND });
        }

        return variableAdvance;
    }


    async getVariableDetails(
        variableId: string,
        year?: number,
        month?: number
    ): Promise<import("../dtos/variable-details-response.dto").VariableDetailsResponseDto> {
        // 1. Fetch Variable
        const variableRepo = this.dataSource.getRepository("Variable");
        const variable = await variableRepo.findOne({ where: { id: variableId } }) as any; // Cast for now, avoiding import if possible

        if (!variable) {
            throw new NotFoundException({ message: `Variable with ID ${variableId} not found`, code: ErrorCodes.VARIABLE_NOT_FOUND });
        }

        // 2. Fetch Goals
        const goalQuery = this.variableGoalRepository.createQueryBuilder("vg")
            .where("vg.variableId = :variableId", { variableId });
        
        if (year) {
            goalQuery.andWhere("vg.year = :year", { year });
        }
        
        const goals = await goalQuery.getMany();

        // 3. Fetch Advances
        const advanceQuery = this.variableAdvanceRepository.createQueryBuilder("va")
            .where("va.variableId = :variableId", { variableId });

        if (year) {
            advanceQuery.andWhere("va.year = :year", { year });
        }

        if (month) {
            advanceQuery.andWhere("va.month = :month", { month });
        }

        // Sort advances by year, then month
        advanceQuery.orderBy("va.year", "ASC").addOrderBy("va.month", "ASC");

        const advances = await advanceQuery.getMany();
        
        // 4. Fetch Quadrenniums
        // Note: Quadrenniums are usually defined by year range (startYear, endYear). 
        // If 'year' param is present, we could check if it falls within range, OR just return all relevant to variable?
        // Usually details view wants all unless specifically filtered.
        // Let's return all for the variable if no specific logic requested, or filter by overlap if year provided?
        // User asked "Traeme los avances... y tambien ... metas", likely wants context.
        // If year is provided, maybe specific quadrennium containing that year?
        // Let's simply fetch all quadrenniums for the variable for now, or those intersecting the year.
        
        const quadQuery = this.variableQuadrenniumRepository.createQueryBuilder("vq")
            .where("vq.variableId = :variableId", { variableId });

        if (year) {
             // If year is provided, we might want quadrenniums that cover this year?
             // "startYear <= year AND endYear >= year"
             quadQuery.andWhere("vq.startYear <= :year AND vq.endYear >= :year", { year });
        }
        
        const quadrenniums = await quadQuery.getMany();


        return {
            variable: {
                id: variable.id,
                code: variable.code,
                name: variable.name,
                observations: variable.observations
            },
            goals: goals.map(g => ({
                id: g.id,
                year: g.year,
                value: Number(g.value)
            })),
            quadrenniums: quadrenniums.map(q => ({
                id: q.id,
                startYear: q.startYear,
                endYear: q.endYear,
                value: Number(q.value)
            })),
            advances: advances.map(a => ({
                id: a.id,
                year: a.year,
                month: a.month,
                value: Number(a.value),
                observations: a.observations, // Assuming entity has this or removed? Check entity.
                createAt: a.createAt
            }))
        };
    }

    async findAllByActionIndicator(
        indicatorId: string,
        year?: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        // 1. Get Variables query linked to this Action Indicator
        const queryBuilder = this.variableActionRelationRepository.createQueryBuilder("var")
            .innerJoinAndSelect("var.variable", "v")
            .leftJoinAndSelect(VariableContextualAccumulator, "vca", "vca.actionRelationId = var.id")
            .where("var.indicatorId = :indicatorId", { indicatorId });

        // 2. Apply Search
        if (search) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where("v.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("v.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        // 3. Pagination
        const total = await queryBuilder.getCount();
        const totalPages = Math.ceil(total / limit);

        const variablesData = await queryBuilder
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
            .skip((page - 1) * limit)
            .take(limit)
            .getRawMany();

        // 4. Fetch Advances for these variables
        if (variablesData.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages, hasNextPage: false, hasPreviousPage: false }
            };
        }

        const variableIds = variablesData.map(v => v.v_id);

        const advancesQuery = this.variableAdvanceRepository.createQueryBuilder("va")
            .where("va.variableId IN (:...variableIds)", { variableIds });

        if (year) {
            advancesQuery.andWhere("va.year = :year", { year });
        }

        advancesQuery.orderBy("va.year", "ASC").addOrderBy("va.month", "ASC");

        const advances = await advancesQuery.getMany();

        // 5. Merge Data
        const data = variablesData.map(data => {
            const variableAdvances = advances.filter(a => a.variableId === data.v_id);
            return {
                variableId: data.v_id,
                variableName: data.v_name,
                variableCode: data.v_code,
                calculatedValue: data.vca_calculated_value ? Number.parseFloat(data.vca_calculated_value) : null,
                lastCalculationDate: data.vca_last_calculation_date,
                actionRelationId: data.var_id,
                advances: variableAdvances
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            }
        };
    }

    async findAllByIndicativeIndicator(
        indicatorId: string,
        year?: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        // 1. Get Variables query linked to this Indicative Indicator
        const queryBuilder = this.variableIndicativeRelationRepository.createQueryBuilder("vir")
            .innerJoinAndSelect("vir.variable", "v")
            .leftJoinAndSelect(VariableContextualAccumulator, "vca", "vca.indicativeRelationId = vir.id")
            .where("vir.indicatorId = :indicatorId", { indicatorId });


        // 2. Apply Search
        if (search) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where("v.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("v.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        // 3. Pagination
        const total = await queryBuilder.getCount();
        const totalPages = Math.ceil(total / limit);

        const variablesData = await queryBuilder
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
            .skip((page - 1) * limit)
            .take(limit)
            .getRawMany();

        // 4. Fetch Advances for these variables
        if (variablesData.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages, hasNextPage: false, hasPreviousPage: false }
            };
        }

        const variableIds = variablesData.map(v => v.v_id);

        const advancesQuery = this.variableAdvanceRepository.createQueryBuilder("va")
            .where("va.variableId IN (:...variableIds)", { variableIds });

        if (year) {
            advancesQuery.andWhere("va.year = :year", { year });
        }

        advancesQuery.orderBy("va.year", "ASC").addOrderBy("va.month", "ASC");

        const advances = await advancesQuery.getMany();

        // 5. Merge Data
        const data = variablesData.map(data => {
            const variableAdvances = advances.filter(a => a.variableId === data.v_id);
            return {
                variableId: data.v_id,
                variableName: data.v_name,
                variableCode: data.v_code,
                calculatedValue: data.vca_calculated_value ? Number.parseFloat(data.vca_calculated_value) : null,
                lastCalculationDate: data.vca_last_calculation_date,
                indicativeRelationId: data.vir_id,
                advances: variableAdvances
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            }
        };
    }

    /**
     * Get variable locations for mapping
     */
    async getVariableLocations(variableId: string): Promise<VariableLocationResponseDto> {
        const variable = await this.dataSource.getRepository(Variable).findOne({ 
            where: { id: variableId } 
        });

        if (!variable) {
            throw new NotFoundException(`Variable with ID ${variableId} not found`);
        }

        const variableLocations = await this.variableLocationRepository
            .createQueryBuilder('vl')
            .leftJoinAndSelect('vl.location', 'location')
            .leftJoinAndSelect('location.commune', 'commune')
            .where('vl.variableId = :variableId', { variableId })
            .getMany();

        const locations = variableLocations.map(vl => ({
            id: vl.location.id,
            communeId: vl.location.communeId,
            communeCode: vl.location.commune.code,
            communeName: vl.location.commune.name,
            address: vl.location.address,
            latitude: vl.location.latitude ? Number.parseFloat(vl.location.latitude.toString()) : undefined,
            longitude: vl.location.longitude ? Number.parseFloat(vl.location.longitude.toString()) : undefined,
        }));

        return {
            variableId: variable.id,
            variableCode: variable.code,
            variableName: variable.name,
            locations,
        };
    }

    /**
     * Get locations for all variables associated with an indicator
     */
    async getIndicatorVariablesLocations(indicatorId: string, type: 'indicative' | 'action'): Promise<VariableLocationResponseDto[]> {
        let variableIds: string[];

        if (type === 'indicative') {
            const relations = await this.variableIndicativeRelationRepository.find({
                where: { indicatorId },
                select: ['variableId']
            });
            variableIds = [...new Set(relations.map(r => r.variableId))];
        } else {
            const relations = await this.variableActionRelationRepository.find({
                where: { indicatorId },
                select: ['variableId']
            });
            variableIds = [...new Set(relations.map(r => r.variableId))];
        }

        if (variableIds.length === 0) {
            return [];
        }

        const results = await Promise.all(
            variableIds.map(varId => this.getVariableLocations(varId).catch(() => null))
        );

        return results.filter((r): r is VariableLocationResponseDto => r !== null);
    }

    /**
     * Get variable advances with location information
     */
    async getVariableAdvancesWithLocations(
        variableId: string,
        year?: number,
        month?: number
    ): Promise<VariableAdvancesWithLocationsResponseDto> {
        const queryBuilder = this.variableAdvanceRepository
            .createQueryBuilder('va')
            .leftJoinAndSelect('va.variable', 'variable')
            .where('va.variableId = :variableId', { variableId });

        if (year) {
            queryBuilder.andWhere('va.year = :year', { year });
        }

        if (month) {
            queryBuilder.andWhere('va.month = :month', { month });
        }

        const advances = await queryBuilder
            .orderBy('va.year', 'DESC')
            .addOrderBy('va.month', 'DESC')
            .getMany();

        // Get commune relations for all advances
        const advanceIds = advances.map(a => a.id);
        const communeRelations = advanceIds.length > 0 
            ? await this.variableAdvanceCommuneRepository
                .createQueryBuilder('vac')
                .leftJoinAndSelect('vac.commune', 'commune')
                .where('vac.variableAdvanceId IN (:...advanceIds)', { advanceIds })
                .getMany()
            : [];

        // Map commune relations to advances
        const communesByAdvanceId = communeRelations.reduce((acc, rel) => {
            if (!acc[rel.variableAdvanceId]) {
                acc[rel.variableAdvanceId] = [];
            }
            acc[rel.variableAdvanceId].push({
                id: rel.commune.id,
                communeId: rel.commune.id,
                communeCode: rel.commune.code,
                communeName: rel.commune.name,
            });
            return acc;
        }, {} as Record<string, any[]>);

        const mappedAdvances = advances.map(advance => ({
            id: advance.id,
            year: advance.year,
            month: advance.month,
            value: advance.value,
            observations: advance.observations,
            createAt: advance.createAt,
            variable: {
                id: advance.variable.id,
                code: advance.variable.code,
                name: advance.variable.name,
            },
            locations: communesByAdvanceId[advance.id] || [],
        }));

        // Also fetch variable-level locations (from variable_locations table)
        let variableLocations: VariableAdvancesWithLocationsResponseDto['variableLocations'] = [];
        try {
            const varLocData = await this.getVariableLocations(variableId);
            variableLocations = varLocData.locations;
        } catch {
            // Variable may have no locations assigned
        }

        return {
            advances: mappedAdvances,
            variableLocations,
        };
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe un avance para esta variable en el periodo especificado");
        }
        if (error.code === "23503") {
            throw new BadRequestException("La variable especificada no existe");
        }
        this.logger.error(error);
    }
}

