import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IndicativePlanIndicatorGoalsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/indicative-plan/indicative-plan-indicator-goals.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('IndicativePlanIndicatorGoalsService', () => {
    let service: IndicativePlanIndicatorGoalsService;
    let mockGoalRepo: any;
    let mockIndicatorRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockGoal = { id: 'g-1', indicatorId: 'ind-1', year: 2024, value: 100 };
    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockGoal], 1);
        mockGoalRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'g-1', year: entity.year ?? 2024 })),
            findOne: jest.fn().mockResolvedValue(mockGoal),
            find: jest.fn().mockResolvedValue([mockGoal]),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new IndicativePlanIndicatorGoalsService(mockGoalRepo, mockIndicatorRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a goal when indicator exists', async () => {
            const dto = { indicatorId: 'ind-1', year: 2024, value: 100 } as any;

            const result = await service.create(dto);

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockGoalRepo.create).toHaveBeenCalledWith(dto);
            expect(mockGoalRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.create({ indicatorId: 'bad-id', year: 2024 } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockGoalRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.create({ indicatorId: 'ind-1', year: 2024, value: 100 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated('ind-1');

            expect(mockGoalRepo.createQueryBuilder).toHaveBeenCalledWith('g');
            expect(mockQb.where).toHaveBeenCalledWith('indicator.id = :indicatorId', { indicatorId: 'ind-1' });
            expect(mockQb.orderBy).toHaveBeenCalledWith('g.createAt', 'DESC');
            expect(result.data).toHaveLength(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated('ind-1', 1, 10, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should handle dotted sortBy', async () => {
            await service.findAllPaginated('ind-1', 1, 10, undefined, 'indicator.code', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('indicator.code', 'ASC');
        });

        it('should default invalid sortBy to createAt', async () => {
            await service.findAllPaginated('ind-1', 1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('g.createAt', 'DESC');
        });

        it('should calculate pagination meta', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated('ind-1', 2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('findAllByIndicator', () => {
        it('should return goals ordered by year', async () => {
            const result = await service.findAllByIndicator('ind-1');

            expect(mockGoalRepo.find).toHaveBeenCalledWith({
                where: { indicatorId: 'ind-1' },
                order: { year: 'ASC' },
            });
            expect(result).toEqual([mockGoal]);
        });
    });

    describe('findOne', () => {
        it('should return a goal by id', async () => {
            const result = await service.findOne('g-1');

            expect(mockGoalRepo.findOne).toHaveBeenCalledWith({ where: { id: 'g-1' } });
            expect(result).toEqual(mockGoal);
        });

        it('should throw NotFoundException if not found', async () => {
            mockGoalRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a goal', async () => {
            const dto = { value: 200 } as any;
            mockGoalRepo.save.mockResolvedValue({ ...mockGoal, value: 200 });

            const result = await service.update('g-1', dto);

            expect(mockGoalRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.value).toBe(200);
        });

        it('should throw NotFoundException if goal not found', async () => {
            mockGoalRepo.findOne.mockResolvedValue(null);

            await expect(service.update('bad-id', { value: 200 } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockGoalRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.update('g-1', { value: 200 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove a goal and audit log', async () => {
            await service.remove('g-1');

            expect(mockGoalRepo.remove).toHaveBeenCalledWith(mockGoal);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            mockGoalRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
        });
    });
});
