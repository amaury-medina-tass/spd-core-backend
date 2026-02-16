import { CdpPositionsService } from '../../../../apps/spd-core-api/src/financial/cdps/services/cdp-positions.service';

describe('CdpPositionsService', () => {
    let service: CdpPositionsService;
    let mockRepo: any;
    let mockFundingRepo: any;
    let mockDetailedActivityRepo: any;
    let mockBudgetRecordRepo: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                getRawMany: jest.fn().mockResolvedValue([]),
                getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
            }),
        };
        mockFundingRepo = {};
        mockDetailedActivityRepo = {};
        mockBudgetRecordRepo = {};
        mockAuditLog = { logSuccess: jest.fn() };

        service = new CdpPositionsService(
            mockRepo, mockFundingRepo, mockDetailedActivityRepo,
            mockBudgetRecordRepo, mockAuditLog,
        );
    });

    describe('findByCdpId', () => {
        it('should query positions by cdpId', async () => {
            const qb = mockRepo.createQueryBuilder();
            await service.findByCdpId('cdp-1');
            expect(qb.where).toHaveBeenCalledWith('position.cdp_id = :cdpId', { cdpId: 'cdp-1' });
        });

        it('should apply search filter when provided', async () => {
            const qb = mockRepo.createQueryBuilder();
            await service.findByCdpId('cdp-1', 'test');
            expect(qb.andWhere).toHaveBeenCalled();
        });
    });
});
