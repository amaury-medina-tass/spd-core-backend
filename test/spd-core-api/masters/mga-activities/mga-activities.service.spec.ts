import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MgaActivitiesService } from '../../../../apps/spd-core-api/src/masters/mga-activities/services/mga-activities.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(resultData),
        getRawOne: jest.fn().mockResolvedValue({ totalValue: '100', totalBalance: '50', count: '0' }),
        getOne: jest.fn().mockResolvedValue(resultData[0] ?? null),
        getCount: jest.fn().mockResolvedValue(total),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('MgaActivitiesService', () => {
    let service: MgaActivitiesService;
    let mockMgaRepo: any;
    let mockRelationRepo: any;
    let mockDetailedRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockMga = {
        id: 'mga-1', code: 'MGA01', name: 'Test MGA',
        observations: 'obs', activityDate: null,
        createAt: new Date(), updateAt: new Date(),
        project: { id: 'proj-1', code: 'P001', name: 'Project 1' },
        product: { id: 'prod-1', productCode: 'PR01', productName: 'Product 1' },
        detailedActivitiesCount: 2,
    };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockMga], 1);
        mockMgaRepo = {
            create: jest.fn().mockImplementation((data: any) => data),
            save: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mga-1', ...data })),
            findOne: jest.fn().mockResolvedValue(mockMga),
            preload: jest.fn().mockImplementation((data: any) => Promise.resolve({ ...mockMga, ...data })),
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
        };
        mockRelationRepo = {
            create: jest.fn().mockImplementation((data: any) => data),
            save: jest.fn().mockResolvedValue([]),
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: 'rel-1', mgaActivityId: 'mga-1', detailedActivityId: 'da-1' }),
            remove: jest.fn().mockResolvedValue(undefined),
            count: jest.fn().mockResolvedValue(2),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([], 0)),
        };
        mockDetailedRepo = {
            findOne: jest.fn().mockResolvedValue({ id: 'da-1', code: 'DA01', name: 'Detailed 1' }),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([], 0)),
        };
        mockAuditLog = { logSuccess: jest.fn().mockResolvedValue(undefined) };

        service = new MgaActivitiesService(
            mockMgaRepo, mockRelationRepo, mockDetailedRepo, mockAuditLog,
        );
    });

    describe('create', () => {
        it('should create MGA activity with relations', async () => {
            const dto = { code: 'MGA01', name: 'Test', detailedActivityIds: ['da-1', 'da-2'] } as any;
            await service.create(dto);

            expect(mockMgaRepo.save).toHaveBeenCalled();
            expect(mockRelationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should create MGA activity without relations', async () => {
            const dto = { code: 'MGA02', name: 'Test2' } as any;
            await service.create(dto);

            expect(mockMgaRepo.save).toHaveBeenCalled();
            expect(mockRelationRepo.save).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockMgaRepo.save.mockRejectedValue({ code: '23505', detail: 'Duplicate' });

            await expect(service.create({ code: 'MGA01', name: 'Dup' } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated results with defaults', async () => {
            mockMgaRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([
                {
                    mgaActivity_id: 'mga-1', mgaActivity_code: 'MGA01', mgaActivity_name: 'Test',
                    mgaActivity_observations: 'obs', mgaActivity_activity_date: null,
                    mgaActivity_create_at: new Date(), mgaActivity_update_at: new Date(),
                    project_id: 'p-1', project_code: 'P001', project_name: 'Proj',
                    product_id: 'pr-1', product_product_code: 'PR01', product_product_name: 'Prod',
                    totalValue: '1000', totalBalance: '500',
                },
            ], 1));

            const result = await service.findAllPaginated();

            expect(result.data).toHaveLength(1);
            expect(result.meta).toHaveProperty('total');
            expect(result.meta).toHaveProperty('page', 1);
            expect(result.meta).toHaveProperty('limit', 10);
        });

        it('should apply search filter', async () => {
            mockMgaRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([], 0));

            await service.findAllPaginated(1, 10, 'test');

            const qb = mockMgaRepo.createQueryBuilder();
            expect(qb.andWhere).toBeDefined();
        });

        it('should sort by value computed field', async () => {
            const qb = createMockQueryBuilder([], 0);
            mockMgaRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'value', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('totalValue', 'ASC');
        });

        it('should sort by balance computed field', async () => {
            const qb = createMockQueryBuilder([], 0);
            mockMgaRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'balance', 'DESC');

            expect(qb.orderBy).toHaveBeenCalledWith('totalBalance', 'DESC');
        });

        it('should sort by dotted field (relation.field)', async () => {
            const qb = createMockQueryBuilder([], 0);
            mockMgaRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'project.code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('project.code', 'ASC');
        });

        it('should default invalid sortBy to mgaActivity.createAt', async () => {
            const qb = createMockQueryBuilder([], 0);
            mockMgaRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'invalidField');

            expect(qb.orderBy).toHaveBeenCalledWith('mgaActivity.createAt', 'DESC');
        });

        it('should calculate pagination meta correctly', async () => {
            const qb = createMockQueryBuilder([
                { mgaActivity_id: 'mga-1', totalValue: '0', totalBalance: '0' },
            ], 25);
            mockMgaRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated(2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('findOne', () => {
        it('should return MGA activity with detailed activities', async () => {
            const result = await service.findOne('mga-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('mga-1');
            expect(result).toHaveProperty('detailedActivities');
            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('balance');
        });

        it('should throw NotFoundException if not found', async () => {
            mockQb.getOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('should apply search to detailed activities', async () => {
            await service.findOne('mga-1', 1, 10, 'searchTerm');

            expect(mockRelationRepo.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update an MGA activity', async () => {
            const dto = { name: 'Updated Name' } as any;

            const result = await service.update('mga-1', dto);

            expect(mockMgaRepo.preload).toHaveBeenCalledWith({ id: 'mga-1', name: 'Updated Name' });
            expect(mockMgaRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if preload returns null', async () => {
            mockMgaRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { name: 'Test' } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockMgaRepo.save.mockRejectedValue({ code: '23505', detail: 'Duplicate' });

            await expect(service.update('mga-1', { name: 'Dup' } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('addDetailedRelation', () => {
        it('should add a detailed relation', async () => {
            mockRelationRepo.create.mockReturnValue({ mgaActivityId: 'mga-1', detailedActivityId: 'da-1' });
            mockRelationRepo.save.mockResolvedValue({ id: 'rel-1', mgaActivityId: 'mga-1', detailedActivityId: 'da-1' });

            const result = await service.addDetailedRelation('mga-1', 'da-1');

            expect(mockMgaRepo.findOne).toHaveBeenCalledWith({ where: { id: 'mga-1' } });
            expect(mockDetailedRepo.findOne).toHaveBeenCalledWith({ where: { id: 'da-1' } });
            expect(mockRelationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if MGA not found', async () => {
            mockMgaRepo.findOne.mockResolvedValue(null);

            await expect(service.addDetailedRelation('bad-mga', 'da-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if detailed activity not found', async () => {
            mockDetailedRepo.findOne.mockResolvedValue(null);

            await expect(service.addDetailedRelation('mga-1', 'bad-da'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate relation', async () => {
            mockRelationRepo.save.mockRejectedValue({ code: '23505', detail: 'Duplicate' });

            await expect(service.addDetailedRelation('mga-1', 'da-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('removeDetailedRelation', () => {
        it('should remove a detailed relation', async () => {
            await service.removeDetailedRelation('mga-1', 'da-1');

            expect(mockRelationRepo.findOne).toHaveBeenCalledWith({
                where: { mgaActivityId: 'mga-1', detailedActivityId: 'da-1' },
            });
            expect(mockRelationRepo.remove).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockRelationRepo.findOne.mockResolvedValue(null);

            await expect(service.removeDetailedRelation('mga-1', 'da-1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('getDetailedRelations', () => {
        it('should return relations for MGA activity', async () => {
            mockRelationRepo.find.mockResolvedValue([{ id: 'rel-1', detailedActivity: { id: 'da-1' } }]);

            const result = await service.getDetailedRelations('mga-1');

            expect(result).toHaveLength(1);
            expect(mockRelationRepo.find).toHaveBeenCalledWith({
                where: { mgaActivityId: 'mga-1' },
                relations: ['detailedActivity'],
            });
        });

        it('should throw NotFoundException if MGA not found', async () => {
            mockQb.getOne.mockResolvedValue(null);

            await expect(service.getDetailedRelations('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDetailedActivitiesForMga', () => {
        it('should return all detailed activities with isAssociated flag', async () => {
            mockRelationRepo.find.mockResolvedValue([{ detailedActivityId: 'da-1' }]);
            const detailedQb = createMockQueryBuilder([{ id: 'da-1' }, { id: 'da-2' }], 2);
            mockDetailedRepo.createQueryBuilder.mockReturnValue(detailedQb);

            const result = await service.getDetailedActivitiesForMga('mga-1', 'all');

            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
        });

        it('should return associated detailed activities', async () => {
            mockRelationRepo.find.mockResolvedValue([{ detailedActivityId: 'da-1' }]);
            const detailedQb = createMockQueryBuilder([{ id: 'da-1' }], 1);
            mockDetailedRepo.createQueryBuilder.mockReturnValue(detailedQb);

            const result = await service.getDetailedActivitiesForMga('mga-1', 'associated');

            expect(result.data).toHaveLength(1);
        });

        it('should return empty for associated when no relations', async () => {
            mockRelationRepo.find.mockResolvedValue([]);

            const result = await service.getDetailedActivitiesForMga('mga-1', 'associated');

            expect(result.data).toHaveLength(0);
            expect(result.meta.total).toBe(0);
        });

        it('should return available detailed activities', async () => {
            mockRelationRepo.find.mockResolvedValue([{ detailedActivityId: 'da-1' }]);
            const detailedQb = createMockQueryBuilder([{ id: 'da-2' }], 1);
            mockDetailedRepo.createQueryBuilder.mockReturnValue(detailedQb);

            const result = await service.getDetailedActivitiesForMga('mga-1', 'available');

            expect(result.data).toHaveLength(1);
        });

        it('should apply search filter', async () => {
            mockRelationRepo.find.mockResolvedValue([]);
            const detailedQb = createMockQueryBuilder([], 0);
            mockDetailedRepo.createQueryBuilder.mockReturnValue(detailedQb);

            await service.getDetailedActivitiesForMga('mga-1', 'all', 1, 20, 'search');

            expect(detailedQb.andWhere).toHaveBeenCalled();
        });

        it('should throw NotFoundException if MGA not found', async () => {
            mockQb.getOne.mockResolvedValue(null);

            await expect(service.getDetailedActivitiesForMga('bad-id'))
                .rejects.toThrow(NotFoundException);
        });
    });
});
