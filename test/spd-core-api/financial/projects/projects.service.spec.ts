import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../../../../apps/spd-core-api/src/financial/projects/services/projects.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(result ?? null);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

describe('ProjectsService', () => {
    let service: ProjectsService;
    let mockRepo: any;
    let mockDepsService: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({ id: 'proj-id', ...dto })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'proj-id', ...entity })),
        };
        mockDepsService = {
            findOne: jest.fn().mockResolvedValue({ id: 'dep-1', code: 'DEP', name: 'Dep' }),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new ProjectsService(mockRepo, mockDepsService, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('creates a project', async () => {
            const dto = {
                code: 'P-01',
                name: 'Project Alpha',
                initialBudget: 1000,
                currentBudget: 1000,
                execution: 0,
                origin: 'SGR',
                dependencyId: 'dep-1',
            };

            const result = await service.create(dto);

            expect(mockDepsService.findOne).toHaveBeenCalledWith('dep-1');
            expect(mockRepo.create).toHaveBeenCalled();
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('throws NotFoundException for invalid dependency', async () => {
            mockDepsService.findOne.mockResolvedValue(null);

            const dto = {
                code: 'P-01',
                name: 'Test',
                initialBudget: 0,
                currentBudget: 0,
                execution: 0,
                origin: 'SGR',
                dependencyId: 'bad-id',
            };

            await expect(service.create(dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllPaginated', () => {
        it('returns empty paginated result', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder());

            const result = await service.findAllPaginated();

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('returns data with pagination', async () => {
            const qb = createMockQueryBuilder();
            const projects = [{ id: '1', code: 'P-01' }];
            qb.getManyAndCount.mockResolvedValue([projects, 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated(1, 10);

            expect(result.data).toEqual(projects);
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

            await service.findAllPaginated(1, 10, undefined, 'dependency.code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('dependency.code', 'ASC');
        });
    });

    describe('findOne', () => {
        it('returns project when found', async () => {
            const project = { id: '1', code: 'P-01' };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(project));

            const result = await service.findOne('1');
            expect(result).toEqual(project);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findForSelect', () => {
        it('returns select data', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: '1', code: 'P', name: 'Project' }], 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findForSelect();

            expect(result.data.length).toBe(1);
            expect(result.meta.hasMore).toBe(false);
        });

        it('applies search when provided', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findForSelect('test');

            expect(qb.andWhere).toHaveBeenCalled();
        });
    });
});
