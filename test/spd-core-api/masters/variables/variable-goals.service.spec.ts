import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VariableGoalsService } from '../../../../apps/spd-core-api/src/masters/variables/services/variable-goals.service';

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

describe('VariableGoalsService', () => {
    let service: VariableGoalsService;
    let mockRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockGoal = { id: 'g-1', variableId: 'var-1', year: 2024, value: 100 };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockGoal], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'g-1' })),
            findOne: jest.fn().mockResolvedValue(mockGoal),
            preload: jest.fn().mockResolvedValue(mockGoal),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariableGoalsService(mockRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a goal and audit log', async () => {
            const dto = { variableId: 'var-1', year: 2024, value: 100 } as any;

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith(dto);
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.create({ variableId: 'var-1', year: 2024, value: 100 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated('var-1');

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('vg');
            expect(mockQb.leftJoin).toHaveBeenCalled();
            expect(mockQb.where).toHaveBeenCalledWith('variable.id = :parentId', { parentId: 'var-1' });
            expect(mockQb.orderBy).toHaveBeenCalledWith('vg.createAt', 'DESC');
            expect(result.data).toHaveLength(1);
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated('var-1', 1, 10, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should handle dotted sortBy for relations', async () => {
            await service.findAllPaginated('var-1', 1, 10, undefined, 'variable.code', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('variable.code', 'ASC');
        });

        it('should default to createAt for invalid sortBy', async () => {
            await service.findAllPaginated('var-1', 1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('vg.createAt', 'DESC');
        });

        it('should calculate pagination meta correctly', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated('var-1', 2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });

        it('should handle page=1 with hasPreviousPage false', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated('var-1', 1, 10);

            expect(result.meta.hasPreviousPage).toBe(false);
        });
    });

    describe('update', () => {
        it('should update a goal and audit log', async () => {
            const dto = { value: 200 } as any;
            mockRepo.preload.mockResolvedValue({ ...mockGoal, value: 200 });
            mockRepo.save.mockResolvedValue({ ...mockGoal, value: 200 });

            const result = await service.update('g-1', dto);

            expect(mockRepo.preload).toHaveBeenCalledWith({ id: 'g-1', ...dto });
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.value).toBe(200);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { value: 200 } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockRepo.preload.mockResolvedValue(mockGoal);
            mockRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.update('g-1', { value: 200 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove a goal and audit log', async () => {
            await service.remove('g-1');

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'g-1' } });
            expect(mockRepo.remove).toHaveBeenCalledWith(mockGoal);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
        });
    });
});
