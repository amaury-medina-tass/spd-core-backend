import { Test, TestingModule } from '@nestjs/testing';
import { VariableAdvancesService } from '../../../../apps/spd-core-api/src/sub/variable-advances/services/variable-advances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditLogService } from '@common/cosmosdb/audit-log.service';
import { AstEvaluatorService } from '../../../../apps/spd-core-api/src/sub/variable-advances/services/ast-evaluator.service';
import { IndicatorAdvancesService } from '../../../../apps/spd-core-api/src/sub/indicator-advances/services/indicator-advances.service';
import { VariableAdvance } from '../../../../apps/spd-core-api/src/sub/variable-advances/entities/variable-advance.entity';
import { VariableContextualAccumulator } from '../../../../apps/spd-core-api/src/sub/variable-advances/entities/variable-contextual-accumulator.entity';
import { Formula } from '../../../../apps/spd-core-api/src/masters/indicators/entities/formula.entity';
import { VariableGoal } from '../../../../apps/spd-core-api/src/masters/variables/entities/variable-goal.entity';
import { VariableIndicativeRelation } from '../../../../apps/spd-core-api/src/masters/indicators/entities/indicative-plan/variable-indicative-relation.entity';
import { VariableActionRelation } from '../../../../apps/spd-core-api/src/masters/indicators/entities/action-plan/variable-action-relation.entity';
import { VariableQuadrennium } from '../../../../apps/spd-core-api/src/masters/variables/entities/variable-quadrennium.entity';
import { IndicativePlanIndicatorGoal } from '../../../../apps/spd-core-api/src/masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity';
import { ActionPlanIndicatorGoal } from '../../../../apps/spd-core-api/src/masters/indicators/entities/action-plan/action-plan-indicator-goal.entity';
import { VariableLocation } from '../../../../apps/spd-core-api/src/masters/variables/entities/variable-location.entity';
import { VariableAdvanceCommune } from '../../../../apps/spd-core-api/src/sub/variable-advances/entities/variable-advance-commune.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function createMockRepository() {
    return {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(data => data),
        save: jest.fn().mockImplementation(data => Promise.resolve({ id: 'new-id', ...data })),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
            getMany: jest.fn().mockResolvedValue([]),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            getRawMany: jest.fn().mockResolvedValue([]),
            getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            getCount: jest.fn().mockResolvedValue(0),
            setParameters: jest.fn().mockReturnThis(),
        }),
    };
}

describe('VariableAdvancesService', () => {
    let service: VariableAdvancesService;
    let mockAdvanceRepo: ReturnType<typeof createMockRepository>;
    let mockAccumulatorRepo: ReturnType<typeof createMockRepository>;
    let mockFormulaRepo: ReturnType<typeof createMockRepository>;
    let mockVarGoalRepo: ReturnType<typeof createMockRepository>;
    let mockVarIndRelRepo: ReturnType<typeof createMockRepository>;
    let mockVarActRelRepo: ReturnType<typeof createMockRepository>;
    let mockVarQuadRepo: ReturnType<typeof createMockRepository>;
    let mockIndGoalRepo: ReturnType<typeof createMockRepository>;
    let mockActGoalRepo: ReturnType<typeof createMockRepository>;
    let mockVarLocRepo: ReturnType<typeof createMockRepository>;
    let mockAdvanceCommuneRepo: ReturnType<typeof createMockRepository>;
    let mockAstEvaluator: { evaluate: jest.Mock };
    let mockIndicatorAdvancesService: { createOrUpdate: jest.Mock };
    let mockDataSource: any;
    let mockQueryRunner: any;
    let mockAuditLog: any;

    beforeEach(async () => {
        mockAdvanceRepo = createMockRepository();
        mockAccumulatorRepo = createMockRepository();
        mockFormulaRepo = createMockRepository();
        mockVarGoalRepo = createMockRepository();
        mockVarIndRelRepo = createMockRepository();
        mockVarActRelRepo = createMockRepository();
        mockVarQuadRepo = createMockRepository();
        mockIndGoalRepo = createMockRepository();
        mockActGoalRepo = createMockRepository();
        mockVarLocRepo = createMockRepository();
        mockAdvanceCommuneRepo = createMockRepository();
        mockAstEvaluator = { evaluate: jest.fn().mockResolvedValue(42) };
        mockIndicatorAdvancesService = { createOrUpdate: jest.fn().mockResolvedValue({}) };
        mockAuditLog = { logSuccess: jest.fn().mockResolvedValue(undefined) };

        mockQueryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                save: jest.fn().mockImplementation((_entity, data) => Promise.resolve({ id: 'saved-id', ...data })),
                create: jest.fn().mockImplementation((_entity, data) => data),
                findOne: jest.fn().mockResolvedValue(null),
            },
        };

        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
            getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01' }),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VariableAdvancesService,
                { provide: getRepositoryToken(VariableAdvance), useValue: mockAdvanceRepo },
                { provide: getRepositoryToken(VariableContextualAccumulator), useValue: mockAccumulatorRepo },
                { provide: getRepositoryToken(Formula), useValue: mockFormulaRepo },
                { provide: getRepositoryToken(VariableGoal), useValue: mockVarGoalRepo },
                { provide: getRepositoryToken(VariableIndicativeRelation), useValue: mockVarIndRelRepo },
                { provide: getRepositoryToken(VariableActionRelation), useValue: mockVarActRelRepo },
                { provide: getRepositoryToken(VariableQuadrennium), useValue: mockVarQuadRepo },
                { provide: getRepositoryToken(IndicativePlanIndicatorGoal), useValue: mockIndGoalRepo },
                { provide: getRepositoryToken(ActionPlanIndicatorGoal), useValue: mockActGoalRepo },
                { provide: getRepositoryToken(VariableLocation), useValue: mockVarLocRepo },
                { provide: getRepositoryToken(VariableAdvanceCommune), useValue: mockAdvanceCommuneRepo },
                { provide: AstEvaluatorService, useValue: mockAstEvaluator },
                { provide: IndicatorAdvancesService, useValue: mockIndicatorAdvancesService },
                { provide: DataSource, useValue: mockDataSource },
                { provide: AuditLogService, useValue: mockAuditLog },
            ],
        }).compile();

        service = module.get<VariableAdvancesService>(VariableAdvancesService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('create', () => {
        it('should create an advance and trigger calculation', async () => {
            mockAdvanceRepo.create.mockReturnValue({ variableId: 'v1', year: 2025, month: 6, value: 50 });
            mockQueryRunner.manager.save.mockResolvedValue({ id: 'adv-1', variableId: 'v1', year: 2025, month: 6, value: 50 });
            const formulaQb = mockFormulaRepo.createQueryBuilder();
            formulaQb.getMany.mockResolvedValue([]);

            const result = await service.create({ variableId: 'v1', year: 2025, month: 6, value: 50 } as any);
            expect(result).toBeDefined();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should create advance with communes', async () => {
            mockAdvanceRepo.create.mockReturnValue({ variableId: 'v1', year: 2025, month: 6, value: 50 });
            mockQueryRunner.manager.save.mockResolvedValue({ id: 'adv-1', variableId: 'v1', year: 2025, month: 6, value: 50 });
            const formulaQb = mockFormulaRepo.createQueryBuilder();
            formulaQb.getMany.mockResolvedValue([]);

            await service.create({ variableId: 'v1', year: 2025, month: 6, value: 50, communeIds: ['c1', 'c2'] } as any);
            expect(mockQueryRunner.manager.create).toHaveBeenCalled();
        });

        it('should rollback on error', async () => {
            mockAdvanceRepo.create.mockReturnValue({ variableId: 'v1', year: 2025, month: 6, value: 50 });
            mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));

            await expect(service.create({ variableId: 'v1', year: 2025, month: 6, value: 50 } as any)).rejects.toThrow();
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return advance when found', async () => {
            const advance = { id: 'adv-1', variableId: 'v1', year: 2025 };
            mockAdvanceRepo.findOne.mockResolvedValue(advance);
            const result = await service.findOne('adv-1');
            expect(result).toEqual(advance);
        });

        it('should throw NotFoundException when not found', async () => {
            mockAdvanceRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated results', async () => {
            const qb = mockAdvanceRepo.createQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            const result = await service.findAllPaginated('var-1', 1, 10);
            expect(result.meta.total).toBe(0);
            expect(result.meta.page).toBe(1);
        });

        it('should handle search parameter', async () => {
            const qb = mockAdvanceRepo.createQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            await service.findAllPaginated('var-1', 1, 10, 'search-term');
            expect(qb.andWhere).toHaveBeenCalled();
        });
    });

    describe('extractGoalVarIds', () => {
        it('should extract goal_var ids from AST', () => {
            const ast = {
                kind: 'binary', op: '+',
                left: { kind: 'goal_var', value: 'g1' },
                right: { kind: 'goal_var', value: 'g2' },
            };
            const result = (service as any).extractGoalVarIds(ast);
            expect(result).toEqual(['g1', 'g2']);
        });

        it('should handle null node', () => {
            const result = (service as any).extractGoalVarIds(null);
            expect(result).toEqual([]);
        });

        it('should extract from args and subFormula', () => {
            const ast = {
                kind: 'call', func: 'SUM',
                args: [{ kind: 'goal_var', value: 'g1' }],
                subFormula: { kind: 'goal_var', value: 'g2' },
            };
            const result = (service as any).extractGoalVarIds(ast);
            expect(result).toContain('g1');
            expect(result).toContain('g2');
        });
    });

    describe('extractQuadVarIds', () => {
        it('should extract quad_var ids from AST', () => {
            const ast = { kind: 'quad_var', value: 'q1' };
            const result = (service as any).extractQuadVarIds(ast);
            expect(result).toEqual(['q1']);
        });

        it('should handle null node', () => {
            const result = (service as any).extractQuadVarIds(null);
            expect(result).toEqual([]);
        });
    });

    describe('handleDBExceptions', () => {
        it('should throw BadRequestException for duplicate entry (23505)', () => {
            expect(() => (service as any).handleDBExceptions({ code: '23505' }))
                .toThrow(BadRequestException);
        });

        it('should throw BadRequestException for FK violation (23503)', () => {
            expect(() => (service as any).handleDBExceptions({ code: '23503' }))
                .toThrow(BadRequestException);
        });

        it('should log non-specific errors', () => {
            expect(() => (service as any).handleDBExceptions({ code: '00000' })).not.toThrow();
        });
    });

    describe('fetchIndicatorGoalValue', () => {
        it('should return indicative goal value when found', async () => {
            mockIndGoalRepo.findOne.mockResolvedValue({ value: 75 });
            const result = await (service as any).fetchIndicatorGoalValue('goal-1');
            expect(result).toBe(75);
        });

        it('should fallback to action goal value', async () => {
            mockIndGoalRepo.findOne.mockResolvedValue(null);
            mockActGoalRepo.findOne.mockResolvedValue({ value: 88 });
            const result = await (service as any).fetchIndicatorGoalValue('goal-2');
            expect(result).toBe(88);
        });

        it('should return 0 when no goal found', async () => {
            mockIndGoalRepo.findOne.mockResolvedValue(null);
            mockActGoalRepo.findOne.mockResolvedValue(null);
            const result = await (service as any).fetchIndicatorGoalValue('missing');
            expect(result).toBe(0);
        });
    });

    describe('fetchFormulaBaseline', () => {
        it('should return parsed baseline', async () => {
            const mockManager = {
                findOne: jest.fn().mockResolvedValue({ baseline: '100,5' }),
            };
            const formula = { indicativeIndicatorId: 'ind-1' };
            const result = await (service as any).fetchFormulaBaseline(formula, mockManager);
            expect(result).toBe(100.5);
        });

        it('should return undefined for non-indicative formula', async () => {
            const formula = { indicativeIndicatorId: null };
            const result = await (service as any).fetchFormulaBaseline(formula, {});
            expect(result).toBeUndefined();
        });

        it('should return 0 for NaN baseline', async () => {
            const mockManager = {
                findOne: jest.fn().mockResolvedValue({ baseline: 'abc' }),
            };
            const formula = { indicativeIndicatorId: 'ind-1' };
            const result = await (service as any).fetchFormulaBaseline(formula, mockManager);
            expect(result).toBe(0);
        });
    });

    describe('getVariableDetails', () => {
        it('should return variable details with goals, advances, and quadrenniums', async () => {
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1', observations: 'obs' }),
            });
            const goalQb = mockVarGoalRepo.createQueryBuilder();
            goalQb.getMany.mockResolvedValue([{ id: 'g1', year: 2024, value: '100' }]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([{ id: 'a1', year: 2024, month: 6, value: '50', observations: 'obs', createAt: new Date() }]);
            const quadQb = mockVarQuadRepo.createQueryBuilder();
            quadQb.getMany.mockResolvedValue([{ id: 'q1', startYear: 2024, endYear: 2027, value: '400' }]);

            const result = await service.getVariableDetails('v1', 2024, 6);
            expect(result.variable.code).toBe('V01');
            expect(result.goals).toHaveLength(1);
            expect(result.advances).toHaveLength(1);
            expect(result.quadrenniums).toHaveLength(1);
        });

        it('should throw NotFoundException when variable not found', async () => {
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null),
            });
            await expect(service.getVariableDetails('missing')).rejects.toThrow(NotFoundException);
        });

        it('should work without year and month filters', async () => {
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1', observations: 'obs' }),
            });
            const goalQb = mockVarGoalRepo.createQueryBuilder();
            goalQb.getMany.mockResolvedValue([]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([]);
            const quadQb = mockVarQuadRepo.createQueryBuilder();
            quadQb.getMany.mockResolvedValue([]);

            const result = await service.getVariableDetails('v1');
            expect(result.variable.id).toBe('v1');
            expect(result.goals).toEqual([]);
        });
    });

    describe('findAllByActionIndicator', () => {
        it('should return empty data when no variables found', async () => {
            const qb = mockVarActRelRepo.createQueryBuilder();
            qb.getCount.mockResolvedValue(0);
            qb.getRawMany.mockResolvedValue([]);

            const result = await service.findAllByActionIndicator('ind-1');
            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return merged variables and advances', async () => {
            const qb = mockVarActRelRepo.createQueryBuilder();
            qb.getCount.mockResolvedValue(1);
            qb.getRawMany.mockResolvedValue([
                { v_id: 'v1', v_name: 'Var 1', v_code: 'V01', vca_calculated_value: '42.5', vca_last_calculation_date: new Date(), var_id: 'rel-1', var_variableId: 'v1', var_indicatorId: 'ind-1' },
            ]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([{ id: 'a1', variableId: 'v1', year: 2024, month: 1, value: 50 }]);

            const result = await service.findAllByActionIndicator('ind-1', 2024);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].variableCode).toBe('V01');
            expect(result.data[0].calculatedValue).toBe(42.5);
            expect(result.data[0].advances).toHaveLength(1);
        });

        it('should apply search filter', async () => {
            const qb = mockVarActRelRepo.createQueryBuilder();
            qb.getCount.mockResolvedValue(0);
            qb.getRawMany.mockResolvedValue([]);

            await service.findAllByActionIndicator('ind-1', undefined, 1, 10, 'search');
            expect(qb.andWhere).toHaveBeenCalled();
        });
    });

    describe('findAllByIndicativeIndicator', () => {
        it('should return empty data when no variables found', async () => {
            const qb = mockVarIndRelRepo.createQueryBuilder();
            qb.getCount.mockResolvedValue(0);
            qb.getRawMany.mockResolvedValue([]);

            const result = await service.findAllByIndicativeIndicator('ind-1');
            expect(result.data).toEqual([]);
        });

        it('should return merged variables and advances', async () => {
            const qb = mockVarIndRelRepo.createQueryBuilder();
            qb.getCount.mockResolvedValue(1);
            qb.getRawMany.mockResolvedValue([
                { v_id: 'v1', v_name: 'Var 1', v_code: 'V01', vca_calculated_value: null, vca_last_calculation_date: null, vir_id: 'rel-1', vir_variableId: 'v1', vir_indicatorId: 'ind-1' },
            ]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([]);

            const result = await service.findAllByIndicativeIndicator('ind-1');
            expect(result.data).toHaveLength(1);
            expect(result.data[0].calculatedValue).toBeNull();
            expect(result.data[0].advances).toEqual([]);
        });
    });

    describe('getVariableLocations', () => {
        it('should return locations for a variable', async () => {
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1' }),
            });
            const qb = mockVarLocRepo.createQueryBuilder();
            qb.getMany.mockResolvedValue([
                { location: { id: 'loc-1', communeId: 'c1', commune: { code: 'COM01', name: 'Comuna Central' }, address: 'Calle 1', latitude: '4.5', longitude: '-75.3' } },
            ]);

            const result = await service.getVariableLocations('v1');
            expect(result.variableCode).toBe('V01');
            expect(result.locations).toHaveLength(1);
            expect(result.locations[0].communeCode).toBe('COM01');
            expect(result.locations[0].latitude).toBe(4.5);
        });

        it('should throw NotFoundException when variable not found', async () => {
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null),
            });
            await expect(service.getVariableLocations('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getIndicatorVariablesLocations', () => {
        it('should return empty array when no variables found for indicative', async () => {
            mockVarIndRelRepo.find.mockResolvedValue([]);
            const result = await service.getIndicatorVariablesLocations('ind-1', 'indicative');
            expect(result).toEqual([]);
        });

        it('should return empty array when no variables found for action', async () => {
            mockVarActRelRepo.find.mockResolvedValue([]);
            const result = await service.getIndicatorVariablesLocations('ind-1', 'action');
            expect(result).toEqual([]);
        });

        it('should return locations for related variables', async () => {
            mockVarIndRelRepo.find.mockResolvedValue([{ variableId: 'v1' }]);
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1' }),
            });
            const qb = mockVarLocRepo.createQueryBuilder();
            qb.getMany.mockResolvedValue([
                { location: { id: 'loc-1', communeId: 'c1', commune: { code: 'COM01', name: 'Comuna 1' }, address: 'Addr', latitude: null, longitude: null } },
            ]);

            const result = await service.getIndicatorVariablesLocations('ind-1', 'indicative');
            expect(result).toHaveLength(1);
            expect(result[0].variableCode).toBe('V01');
        });

        it('should deduplicate variable IDs', async () => {
            mockVarActRelRepo.find.mockResolvedValue([{ variableId: 'v1' }, { variableId: 'v1' }]);
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1' }),
            });
            const qb = mockVarLocRepo.createQueryBuilder();
            qb.getMany.mockResolvedValue([]);

            const result = await service.getIndicatorVariablesLocations('ind-1', 'action');
            expect(result).toHaveLength(1);
        });
    });

    describe('getVariableAdvancesWithLocations', () => {
        it('should return advances with commune locations', async () => {
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([
                { id: 'a1', year: 2024, month: 6, value: 50, observations: 'obs', createAt: new Date(), variableId: 'v1', variable: { id: 'v1', code: 'V01', name: 'Var 1' } },
            ]);
            const communeQb = mockAdvanceCommuneRepo.createQueryBuilder();
            communeQb.getMany.mockResolvedValue([
                { variableAdvanceId: 'a1', commune: { id: 'c1', code: 'COM01', name: 'Comuna 1' } },
            ]);
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1' }),
            });
            const locQb = mockVarLocRepo.createQueryBuilder();
            locQb.getMany.mockResolvedValue([]);

            const result = await service.getVariableAdvancesWithLocations('v1', 2024, 6);
            expect(result.advances).toHaveLength(1);
            expect(result.advances[0].locations).toHaveLength(1);
            expect(result.advances[0].locations[0].communeCode).toBe('COM01');
        });

        it('should handle empty advances', async () => {
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([]);
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'v1', code: 'V01', name: 'Var 1' }),
            });
            const locQb = mockVarLocRepo.createQueryBuilder();
            locQb.getMany.mockResolvedValue([]);

            const result = await service.getVariableAdvancesWithLocations('v1');
            expect(result.advances).toEqual([]);
        });

        it('should handle getVariableLocations error gracefully', async () => {
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getMany.mockResolvedValue([]);
            mockDataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getVariableAdvancesWithLocations('v1');
            expect(result.variableLocations).toEqual([]);
        });
    });

    describe('recalculateForFormula', () => {
        it('should recalculate for indicative formula', async () => {
            const formula = { id: 'f1', indicativeIndicatorId: 'ind-1', actionIndicatorId: null, ast: {} } as any;
            mockVarIndRelRepo.find.mockResolvedValue([{ variableId: 'v1' }]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getRawMany.mockResolvedValue([{ year: 2024 }]);
            // processFormula needs lots of mocks - ensure it doesn't crash
            const formulaQb = mockFormulaRepo.createQueryBuilder();
            formulaQb.getMany.mockResolvedValue([]);

            await service.recalculateForFormula(formula);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should recalculate for action formula with monthly iteration', async () => {
            const formula = { id: 'f1', indicativeIndicatorId: null, actionIndicatorId: 'act-1', ast: {} } as any;
            mockVarActRelRepo.find.mockResolvedValue([{ variableId: 'v1' }]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getRawMany.mockResolvedValue([{ year: 2024 }]);

            await service.recalculateForFormula(formula);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should rollback on error', async () => {
            const formula = { id: 'f1', indicativeIndicatorId: 'ind-1', actionIndicatorId: null, ast: {} } as any;
            mockVarIndRelRepo.find.mockResolvedValue([{ variableId: 'v1' }]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getRawMany.mockRejectedValue(new Error('DB error'));

            await expect(service.recalculateForFormula(formula)).rejects.toThrow('DB error');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should handle no variables', async () => {
            const formula = { id: 'f1', indicativeIndicatorId: 'ind-1', actionIndicatorId: null, ast: {} } as any;
            mockVarIndRelRepo.find.mockResolvedValue([]);
            const advQb = mockAdvanceRepo.createQueryBuilder();
            advQb.getRawMany.mockResolvedValue([]);

            await service.recalculateForFormula(formula);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });
});
