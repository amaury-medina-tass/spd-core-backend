import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DetailedActivitiesService } from '../../../../apps/spd-core-api/src/masters/detailed-activities/services/detailed-activities.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('DetailedActivitiesService', () => {
    let service: DetailedActivitiesService;
    let mockRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockActivity = { id: 'da-1', code: 'DA001', name: 'Activity 1', observations: 'obs' };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockActivity], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'da-1' })),
            findOne: jest.fn().mockResolvedValue(mockActivity),
            preload: jest.fn().mockResolvedValue(mockActivity),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new DetailedActivitiesService(mockRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create and audit log an activity', async () => {
            const dto = { code: 'DA001', name: 'Act 1' } as any;

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith(dto);
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate key' });

            await expect(service.create({ code: 'DA001', name: 'Act' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated();

            expect(mockQb.leftJoin).toHaveBeenCalledTimes(2); // project + rubric
            expect(mockQb.orderBy).toHaveBeenCalledWith('detailedActivity.createAt', 'DESC');
            expect(result.data).toHaveLength(1);
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated(1, 10, 'test');

            expect(mockQb.where).toHaveBeenCalled();
        });

        it('should handle dotted sortBy for relations', async () => {
            await service.findAllPaginated(1, 10, undefined, 'project.code', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('project.code', 'ASC');
        });

        it('should use default sortBy for invalid field', async () => {
            await service.findAllPaginated(1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('detailedActivity.createAt', 'DESC');
        });

        it('should calculate pagination meta correctly', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated(2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('findOne', () => {
        it('should return activity with relations', async () => {
            const result = await service.findOne('da-1');

            expect(mockRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'da-1' },
                relations: ['project', 'rubric'],
            });
            expect(result).toEqual(mockActivity);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update and audit log an activity', async () => {
            const dto = { name: 'Updated' } as any;
            mockRepo.preload.mockResolvedValue({ ...mockActivity, name: 'Updated' });
            mockRepo.save.mockResolvedValue({ ...mockActivity, name: 'Updated' });

            const result = await service.update('da-1', dto);

            expect(mockRepo.preload).toHaveBeenCalledWith({ id: 'da-1', ...dto });
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });

        it('should throw NotFoundException if preload returns null', async () => {
            mockRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRepo.preload.mockResolvedValue(mockActivity);
            mockRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate' });

            await expect(service.update('da-1', { code: 'dup' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove and audit log', async () => {
            await service.remove('da-1');

            expect(mockRepo.remove).toHaveBeenCalledWith(mockActivity);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });
    });

    describe('findForSelect', () => {
        it('should return select data with meta', async () => {
            const result = await service.findForSelect();

            expect(mockQb.select).toHaveBeenCalled();
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
        });

        it('should apply search when provided', async () => {
            await service.findForSelect('test');

            expect(mockQb.where).toHaveBeenCalled();
        });
    });
});
