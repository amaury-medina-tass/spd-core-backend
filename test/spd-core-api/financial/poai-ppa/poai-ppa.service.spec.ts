import { NotFoundException, ConflictException } from '@nestjs/common';
import { PoaiPpaService } from '../../../../apps/spd-core-api/src/financial/poai-ppa/services/poai-ppa.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(result ?? null);
    qb.getMany = jest.fn().mockResolvedValue([]);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    qb.getRawOne = jest.fn().mockResolvedValue({
        yearCount: '0', totalProjected: '0', totalAssigned: '0',
        avgProjected: '0', avgAssigned: '0', minYear: null, maxYear: null,
    });
    qb.getRawMany = jest.fn().mockResolvedValue([]);
    return qb;
}

describe('PoaiPpaService', () => {
    let service: PoaiPpaService;
    let mockRepo: any;
    let mockProjectsService: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({ id: 'poai-id', ...dto })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'poai-id', createAt: new Date(), updateAt: new Date(), ...entity })),
            findOne: jest.fn().mockResolvedValue(null),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockProjectsService = {
            findOne: jest.fn().mockResolvedValue({ id: 'proj-1', code: 'P-01', name: 'Project' }),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new PoaiPpaService(mockRepo, mockProjectsService, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('creates a POAI PPA record', async () => {
            const dto = { projectId: 'proj-1', projectCode: 'P-01', year: 2024, projectedPoai: 1000, assignedPoai: 800 };

            const result = await service.create(dto);

            expect(mockProjectsService.findOne).toHaveBeenCalledWith('proj-1');
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.year).toBe(2024);
        });

        it('throws ConflictException when duplicate exists', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'existing' });
            const dto = { projectId: 'proj-1', year: 2024 };

            await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAllPaginated', () => {
        it('returns empty page', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder());

            const result = await service.findAllPaginated();

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('filters by year and projectId', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, undefined, undefined, 2024, 'proj-1');

            expect(qb.andWhere).toHaveBeenCalled();
        });

        it('applies search', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, 'test');

            expect(qb.where).toHaveBeenCalled();
        });

        it('sorts by relation field', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'project.code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('project.code', 'ASC');
        });
    });

    describe('findOne', () => {
        it('returns record when found', async () => {
            const poaiPpa = { id: '1', year: 2024, project: { id: 'proj-1', code: 'P-01', name: 'P' } };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(poaiPpa));

            const result = await service.findOne('1');
            expect(result).toEqual(poaiPpa);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('updates a POAI PPA record', async () => {
            const existing = { id: '1', year: 2024, projectCode: 'P-01', projectedPoai: 1000, assignedPoai: 800, project: { id: 'proj-1', code: 'P-01' } };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(existing));

            const result = await service.update('1', { projectedPoai: 1500 });

            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('throws ConflictException when updating to duplicate year for same project', async () => {
            const existing = { id: '1', year: 2024, projectCode: 'P-01', projectedPoai: 1000, assignedPoai: 800, project: { id: 'proj-1', code: 'P-01' } };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(existing));
            mockRepo.findOne.mockResolvedValue({ id: '2' }); // different existing record

            await expect(service.update('1', { year: 2025 })).rejects.toThrow(ConflictException);
        });
    });

    describe('remove', () => {
        it('removes a POAI PPA record', async () => {
            const existing = { id: '1', year: 2024, projectCode: 'P-01', project: { id: 'proj-1' } };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(existing));

            const result = await service.remove('1');

            expect(mockRepo.remove).toHaveBeenCalledWith(existing);
            expect(result.message).toContain('eliminado');
        });
    });

    describe('findByProjectAndYear', () => {
        it('returns record when found', async () => {
            const poai = { id: '1', year: 2024 };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(poai));

            const result = await service.findByProjectAndYear('proj-1', 2024);
            expect(result).toEqual(poai);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

            await expect(service.findByProjectAndYear('proj-1', 2024)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findYearComparisonByProject', () => {
        it('returns year comparison with summary', async () => {
            const data = [
                { year: 2023, projectedPoai: 1000, assignedPoai: 800 },
                { year: 2024, projectedPoai: 1200, assignedPoai: 900 },
            ];
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue(data);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findYearComparisonByProject('proj-1');

            expect(result.data).toEqual(data);
            expect(result.summary.totalYears).toBe(2);
            expect(result.summary.years).toEqual([2023, 2024]);
        });
    });

    describe('getBudgetSummaryByProject', () => {
        it('returns budget summary', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawOne.mockResolvedValue({
                yearCount: '3', totalProjected: '3000', totalAssigned: '2500',
                avgProjected: '1000', avgAssigned: '833.33', minYear: 2022, maxYear: 2024,
            });
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getBudgetSummaryByProject('proj-1');

            expect(result.project.code).toBe('P-01');
            expect(result.summary.yearCount).toBe(3);
            expect(result.summary.totalProjected).toBe(3000);
            expect(result.summary.executionRate).toBeGreaterThan(0);
        });
    });

    describe('getProjectBudgetEvolution', () => {
        it('returns evolution data with YoY changes', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { year: 2023, projectedPoai: '1000', assignedPoai: '800' },
                { year: 2024, projectedPoai: '1200', assignedPoai: '900' },
            ]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getProjectBudgetEvolution('proj-1');

            expect(result.project.code).toBe('P-01');
            expect(result.evolution.length).toBe(2);
            expect(result.evolution[0].yoyProjectedChange).toBeNull();
            expect(result.evolution[1].yoyProjectedChange).toBe(200);
        });
    });

    describe('getYearlyTrends', () => {
        it('returns yearly trends', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { year: 2024, projectCount: '5', totalProjected: '5000', totalAssigned: '4000', avgProjected: '1000', avgAssigned: '800' },
            ]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getYearlyTrends();

            expect(result.data[0].year).toBe(2024);
            expect(result.data[0].executionRate).toBe(80);
            expect(result.meta.totalYears).toBe(1);
        });

        it('filters by year range', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getYearlyTrends(2020, 2024);

            expect(qb.andWhere).toHaveBeenCalledTimes(2);
        });
    });
});
