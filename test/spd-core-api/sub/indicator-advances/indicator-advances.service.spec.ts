import { Test, TestingModule } from '@nestjs/testing';
import { IndicatorAdvancesService } from '../../../../apps/spd-core-api/src/sub/indicator-advances/services/indicator-advances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IndicatorAdvance } from '../../../../apps/spd-core-api/src/sub/indicator-advances/entities/indicator-advance.entity';
import { IndicativePlanIndicator } from '../../../../apps/spd-core-api/src/masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity';
import { ActionPlanIndicator } from '../../../../apps/spd-core-api/src/masters/indicators/entities/action-plan/action-plan-indicator.entity';
import { ActionPlanIndicatorGoal } from '../../../../apps/spd-core-api/src/masters/indicators/entities/action-plan/action-plan-indicator-goal.entity';
import { IndicativePlanIndicatorGoal } from '../../../../apps/spd-core-api/src/masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity';
import { VariableActionRelation } from '../../../../apps/spd-core-api/src/masters/indicators/entities/action-plan/variable-action-relation.entity';
import { VariableIndicativeRelation } from '../../../../apps/spd-core-api/src/masters/indicators/entities/indicative-plan/variable-indicative-relation.entity';
import { Variable } from '../../../../apps/spd-core-api/src/masters/variables/entities/variable.entity';
import { VariableGoal } from '../../../../apps/spd-core-api/src/masters/variables/entities/variable-goal.entity';
import { VariableAdvance } from '../../../../apps/spd-core-api/src/sub/variable-advances/entities/variable-advance.entity';
import { VariableContextualAccumulator } from '../../../../apps/spd-core-api/src/sub/variable-advances/entities/variable-contextual-accumulator.entity';
import { AuditLogService } from '@common/cosmosdb/audit-log.service';
import { NotFoundException } from '@nestjs/common';

function createMockRepository() {
    return {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(data => data),
        save: jest.fn().mockImplementation(data => Promise.resolve({ id: 'new-id', ...data })),
        update: jest.fn().mockResolvedValue(undefined),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
            getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            getMany: jest.fn().mockResolvedValue([]),
        }),
    };
}

describe('IndicatorAdvancesService', () => {
    let service: IndicatorAdvancesService;
    let mockRepo: ReturnType<typeof createMockRepository>;
    let mockIndicativeRepo: ReturnType<typeof createMockRepository>;
    let mockActionRepo: ReturnType<typeof createMockRepository>;
    let mockActionGoalRepo: ReturnType<typeof createMockRepository>;
    let mockIndicativeGoalRepo: ReturnType<typeof createMockRepository>;
    let mockVarActionRelRepo: ReturnType<typeof createMockRepository>;
    let mockVarIndicativeRelRepo: ReturnType<typeof createMockRepository>;
    let mockVariableRepo: ReturnType<typeof createMockRepository>;
    let mockVarGoalRepo: ReturnType<typeof createMockRepository>;
    let mockVarAdvanceRepo: ReturnType<typeof createMockRepository>;
    let mockVarAccumulatorRepo: ReturnType<typeof createMockRepository>;
    let mockAuditLog: { logSuccess: jest.Mock; logError: jest.Mock };

    beforeEach(async () => {
        mockRepo = createMockRepository();
        mockIndicativeRepo = createMockRepository();
        mockActionRepo = createMockRepository();
        mockActionGoalRepo = createMockRepository();
        mockIndicativeGoalRepo = createMockRepository();
        mockVarActionRelRepo = createMockRepository();
        mockVarIndicativeRelRepo = createMockRepository();
        mockVariableRepo = createMockRepository();
        mockVarGoalRepo = createMockRepository();
        mockVarAdvanceRepo = createMockRepository();
        mockVarAccumulatorRepo = createMockRepository();
        mockAuditLog = { logSuccess: jest.fn().mockResolvedValue(undefined), logError: jest.fn().mockResolvedValue(undefined) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IndicatorAdvancesService,
                { provide: getRepositoryToken(IndicatorAdvance), useValue: mockRepo },
                { provide: getRepositoryToken(IndicativePlanIndicator), useValue: mockIndicativeRepo },
                { provide: getRepositoryToken(ActionPlanIndicator), useValue: mockActionRepo },
                { provide: getRepositoryToken(ActionPlanIndicatorGoal), useValue: mockActionGoalRepo },
                { provide: getRepositoryToken(IndicativePlanIndicatorGoal), useValue: mockIndicativeGoalRepo },
                { provide: getRepositoryToken(VariableActionRelation), useValue: mockVarActionRelRepo },
                { provide: getRepositoryToken(VariableIndicativeRelation), useValue: mockVarIndicativeRelRepo },
                { provide: getRepositoryToken(Variable), useValue: mockVariableRepo },
                { provide: getRepositoryToken(VariableGoal), useValue: mockVarGoalRepo },
                { provide: getRepositoryToken(VariableAdvance), useValue: mockVarAdvanceRepo },
                { provide: getRepositoryToken(VariableContextualAccumulator), useValue: mockVarAccumulatorRepo },
                { provide: AuditLogService, useValue: mockAuditLog },
            ],
        }).compile();

        service = module.get<IndicatorAdvancesService>(IndicatorAdvancesService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('createOrUpdate', () => {
        it('should create a new action indicator advance when none exists', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getOne.mockResolvedValue(null);
            mockRepo.create.mockReturnValue({ year: 2025, month: 6, value: 50, actionIndicatorId: 'ind-1' });
            mockRepo.save.mockResolvedValue({ id: 'adv-1', year: 2025, month: 6, value: 50 });
            mockActionRepo.findOne.mockResolvedValue({ code: 'AI01', name: 'Action Indicator' });

            const result = await service.createOrUpdate('ind-1', 'action', 2025, 6, 50);

            expect(result).toBeDefined();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should update existing advance', async () => {
            const existing = { id: 'adv-1', year: 2025, month: 6, value: 30 };
            const qb = mockRepo.createQueryBuilder();
            qb.getOne.mockResolvedValue(existing);
            mockRepo.save.mockResolvedValue({ ...existing, value: 50 });
            mockIndicativeRepo.findOne.mockResolvedValue({ code: 'II01' });

            const result = await service.createOrUpdate('ind-1', 'indicative', 2025, 6, 50);
            expect(result.value).toBe(50);
        });

        it('should handle null month (annual)', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getOne.mockResolvedValue(null);
            mockRepo.create.mockReturnValue({ year: 2025, month: null, value: 100 });
            mockRepo.save.mockResolvedValue({ id: 'adv-2', year: 2025, month: null, value: 100 });

            await service.createOrUpdate('ind-1', 'indicative', 2025, null, 100);
            expect(qb.andWhere).toHaveBeenCalledWith('ia.month IS NULL');
        });
    });

    describe('getIndicatorDetails', () => {
        it('should throw NotFoundException when indicator not found', async () => {
            mockActionRepo.findOne.mockResolvedValue(null);

            await expect(service.getIndicatorDetails('ind-1', 'action'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return full details for action indicator', async () => {
            const indicator = { id: 'ind-1', code: 'AI01', name: 'Test', description: 'Desc', unitMeasure: { name: 'Unidades' } };
            mockActionRepo.findOne.mockResolvedValue(indicator);
            mockActionGoalRepo.find.mockResolvedValue([{ id: 'g1', year: 2025, value: 100 }]);
            mockVarActionRelRepo.find.mockResolvedValue([]);

            const result = await service.getIndicatorDetails('ind-1', 'action');
            expect(result.indicator.code).toBe('AI01');
            expect(result.goals).toHaveLength(1);
        });

        it('should return details for indicative indicator with year filter', async () => {
            const indicator = { id: 'ind-1', code: 'II01', name: 'Test', description: 'Desc', unitMeasure: null };
            mockIndicativeRepo.findOne.mockResolvedValue(indicator);
            mockIndicativeGoalRepo.find.mockResolvedValue([]);
            mockVarIndicativeRelRepo.find.mockResolvedValue([]);

            const result = await service.getIndicatorDetails('ind-1', 'indicative', 2025);
            expect(result.indicator.code).toBe('II01');
        });

        it('should fetch variable details with accumulators', async () => {
            const indicator = { id: 'ind-1', code: 'AI01', name: 'Test', description: 'D', unitMeasure: null };
            mockActionRepo.findOne.mockResolvedValue(indicator);
            mockActionGoalRepo.find.mockResolvedValue([]);

            const variable = { id: 'v1', name: 'Var1', code: 'V01' };
            mockVarActionRelRepo.find.mockResolvedValue([{ id: 'rel-1', indicatorId: 'ind-1', variable }]);
            mockVarGoalRepo.find.mockResolvedValue([]);

            const vaQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            mockVarAdvanceRepo.createQueryBuilder.mockReturnValue(vaQb);
            mockVarAccumulatorRepo.findOne.mockResolvedValue({ calculatedValue: 42, lastCalculationDate: new Date() });

            const result = await service.getIndicatorDetails('ind-1', 'action');
            expect(result.variables).toHaveLength(1);
            expect(result.variables[0].calculatedValue).toBe(42);
        });
    });

    describe('updateParentCache', () => {
        it('should update action indicator compliancePercentage', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getRawOne.mockResolvedValue({ total: '75.5' });

            await (service as any).updateParentCache('ind-1', 'action');

            expect(mockActionRepo.update).toHaveBeenCalledWith('ind-1', { compliancePercentage: 75.5 });
        });

        it('should update indicative indicator advancePercentage', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getRawOne.mockResolvedValue({ total: '60' });

            await (service as any).updateParentCache('ind-1', 'indicative');

            expect(mockIndicativeRepo.update).toHaveBeenCalledWith('ind-1', { advancePercentage: 60 });
        });

        it('should default to 0 when no total', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getRawOne.mockResolvedValue(null);

            await (service as any).updateParentCache('ind-1', 'action');

            expect(mockActionRepo.update).toHaveBeenCalledWith('ind-1', { compliancePercentage: 0 });
        });
    });

    describe('fetchAccumulatedAdvance', () => {
        it('should return null when no advance exists', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getOne.mockResolvedValue(null);

            const result = await (service as any).fetchAccumulatedAdvance('ind-1', 'action');
            expect(result).toBeNull();
        });

        it('should return latest advance dto', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getOne.mockResolvedValue({ id: 'adv-1', year: 2025, month: 12, value: 80 });

            const result = await (service as any).fetchAccumulatedAdvance('ind-1', 'indicative');
            expect(result).toEqual({ id: 'adv-1', year: 2025, month: 12, value: 80 });
        });
    });

    describe('fetchFilteredAdvances', () => {
        it('should filter by year and month', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getMany.mockResolvedValue([]);

            await (service as any).fetchFilteredAdvances('ind-1', 'action', 2025, 6);

            expect(qb.andWhere).toHaveBeenCalledWith('ia.year = :year', { year: 2025 });
            expect(qb.andWhere).toHaveBeenCalledWith('ia.month = :month', { month: 6 });
        });

        it('should not filter when null', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.getMany.mockResolvedValue([]);

            await (service as any).fetchFilteredAdvances('ind-1', 'indicative', null, null);

            expect(qb.andWhere).not.toHaveBeenCalled();
        });
    });
});
