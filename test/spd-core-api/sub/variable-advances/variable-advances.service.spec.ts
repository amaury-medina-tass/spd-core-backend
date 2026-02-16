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
});
