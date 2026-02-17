import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CdpPositionsService } from '../../../../apps/spd-core-api/src/financial/cdps/services/cdp-positions.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue(resultData),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({ count: String(total) }),
    };
    return qb;
}

describe('CdpPositionsService', () => {
    let service: CdpPositionsService;
    let mockRepo: any;
    let mockFundingRepo: any;
    let mockDetailedActivityRepo: any;
    let mockBudgetRecordRepo: any;
    let mockAuditLog: any;

    const mockPosition = {
        id: 'pos-1', positionNumber: 'P001', value: 1000, observations: 'obs',
        cdp: { id: 'cdp-1', cdpProjects: [{ projectId: 'proj-1' }] },
    };

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn().mockResolvedValue(mockPosition),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity })),
        };
        mockFundingRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'f-1' })),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockDetailedActivityRepo = {
            findOne: jest.fn().mockResolvedValue({ id: 'da-1', code: 'DA001', projectId: 'proj-1' }),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        };
        mockBudgetRecordRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockAuditLog = { logSuccess: jest.fn().mockResolvedValue(undefined) };

        service = new CdpPositionsService(
            mockRepo, mockFundingRepo, mockDetailedActivityRepo,
            mockBudgetRecordRepo, mockAuditLog,
        );
    });

    describe('findByCdpId', () => {
        it('should query positions by cdpId', async () => {
            const mockQb = createMockQueryBuilder([mockPosition]);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            await service.findByCdpId('cdp-1');
            expect(mockQb.where).toHaveBeenCalledWith('position.cdp_id = :cdpId', { cdpId: 'cdp-1' });
        });

        it('should apply search filter when provided', async () => {
            const mockQb = createMockQueryBuilder([]);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            await service.findByCdpId('cdp-1', 'test');
            expect(mockQb.andWhere).toHaveBeenCalled();
        });
    });

    describe('findForTable', () => {
        it('should return paginated table data with defaults', async () => {
            const mockQb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findForTable();

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            const mockQb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findForTable(1, 10, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should apply masterContractId filter', async () => {
            const mockQb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findForTable(1, 10, undefined, undefined, undefined, 'mc-1');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should handle valid sortBy', async () => {
            const mockQb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findForTable(1, 10, undefined, 'pos.positionNumber', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('pos.position_number', 'ASC');
        });

        it('should default invalid sortBy', async () => {
            const mockQb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findForTable(1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('cdp.number', 'DESC');
        });

        it('should map raw data to CdpTableRowDto', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getRawMany.mockResolvedValue([{
                id: 'pos-1',
                projectCode: 'P001',
                rubricCode: 'R001',
                positionNumber: '1',
                positionValue: '1000',
                needCode: 'N001',
                cdpNumber: 'CDP001',
                cdpTotalValue: '5000',
                fundingSourceName: 'Fund 1',
                fundingSourceCode: 'FS001',
                observations: 'obs',
            }]);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findForTable();

            expect(result.data[0]).toHaveProperty('positionValue', 1000);
            expect(result.data[0]).toHaveProperty('cdpTotalValue', 5000);
        });
    });

    describe('findOne', () => {
        it('should return a position detail', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getRawOne.mockResolvedValue({
                id: 'pos-1',
                projectCode: 'P001',
                rubricCode: 'R001',
                positionNumber: '1',
                positionValue: '1000',
                needCode: 'N001',
                cdpId: 'cdp-1',
                cdpNumber: 'CDP001',
                cdpTotalValue: '5000',
                fundingSourceName: null,
                fundingSourceCode: null,
                observations: 'obs',
                masterContractId: null,
            });
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            const fundingQb = createMockQueryBuilder();
            fundingQb.getRawOne.mockResolvedValue({ totalConsumed: '500' });
            fundingQb.getRawMany.mockResolvedValue([]);
            mockFundingRepo.createQueryBuilder.mockReturnValue(fundingQb);

            const result = await service.findOne('pos-1');

            expect(result).toHaveProperty('id', 'pos-1');
            expect(result).toHaveProperty('totalConsumed', 500);
        });

        it('should throw NotFoundException if position not found', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getRawOne.mockResolvedValue(null);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateObservations', () => {
        it('should update observations and audit log', async () => {
            mockRepo.save.mockResolvedValue({ ...mockPosition, observations: 'new obs' });

            const result = await service.updateObservations('pos-1', 'new obs');

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'pos-1' } });
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if position not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.updateObservations('bad-id', 'obs'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('getDetailedActivitiesForPosition', () => {
        it('should throw NotFoundException if position not found', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(null);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await expect(service.getDetailedActivitiesForPosition('bad-id'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return empty if no project ids', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue({ id: 'pos-1', cdp: { cdpProjects: [] } });
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.getDetailedActivitiesForPosition('pos-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return empty for associated when no funding records', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            mockFundingRepo.find.mockResolvedValue([]);

            const result = await service.getDetailedActivitiesForPosition('pos-1', 'associated');

            expect(result.data).toEqual([]);
        });

        it('should return activities for valid position with type=all', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            mockFundingRepo.find.mockResolvedValue([{ detailedActivityId: 'da-1' }]);

            const actQb = createMockQueryBuilder([{ id: 'da-1' }], 1);
            mockDetailedActivityRepo.createQueryBuilder.mockReturnValue(actQb);

            const result = await service.getDetailedActivitiesForPosition('pos-1', 'all');

            expect(result.data[0]).toHaveProperty('isAssociated');
        });
    });

    describe('associateActivity', () => {
        it('should associate an activity with a position', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.associateActivity('pos-1', 'da-1');

            expect(mockFundingRepo.create).toHaveBeenCalledWith({
                cdpPositionId: 'pos-1',
                detailedActivityId: 'da-1',
            });
            expect(mockFundingRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if position not found', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(null);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);

            await expect(service.associateActivity('bad-id', 'da-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if activity not found', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            mockDetailedActivityRepo.findOne.mockResolvedValue(null);

            await expect(service.associateActivity('pos-1', 'bad-da'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if activity is from wrong project', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            mockDetailedActivityRepo.findOne.mockResolvedValue({ id: 'da-1', projectId: 'proj-other' });

            await expect(service.associateActivity('pos-1', 'da-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if already associated', async () => {
            const mockQb = createMockQueryBuilder();
            mockQb.getOne.mockResolvedValue(mockPosition);
            mockRepo.createQueryBuilder.mockReturnValue(mockQb);
            mockFundingRepo.findOne.mockResolvedValue({ id: 'f-1' });

            await expect(service.associateActivity('pos-1', 'da-1'))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('disassociateActivity', () => {
        it('should disassociate an activity', async () => {
            mockFundingRepo.findOne.mockResolvedValue({
                id: 'f-1', balance: 0, assignedValue: 0,
            });

            await service.disassociateActivity('pos-1', 'da-1');

            expect(mockFundingRepo.remove).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if funding not found', async () => {
            mockFundingRepo.findOne.mockResolvedValue(null);

            await expect(service.disassociateActivity('pos-1', 'da-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if has balance', async () => {
            mockFundingRepo.findOne.mockResolvedValue({
                id: 'f-1', balance: 100, assignedValue: 0,
            });

            await expect(service.disassociateActivity('pos-1', 'da-1'))
                .rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException if has assigned value', async () => {
            mockFundingRepo.findOne.mockResolvedValue({
                id: 'f-1', balance: 0, assignedValue: 500,
            });

            await expect(service.disassociateActivity('pos-1', 'da-1'))
                .rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException on FK violation (23503)', async () => {
            mockFundingRepo.findOne.mockResolvedValue({
                id: 'f-1', balance: 0, assignedValue: 0,
            });
            mockFundingRepo.remove.mockRejectedValue({ code: '23503' });

            await expect(service.disassociateActivity('pos-1', 'da-1'))
                .rejects.toThrow(ConflictException);
        });
    });
});
