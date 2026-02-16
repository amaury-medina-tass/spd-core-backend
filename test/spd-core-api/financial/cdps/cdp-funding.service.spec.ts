import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CdpFundingService } from '../../../../apps/spd-core-api/src/financial/cdps/services/cdp-funding.service';

function createMockManager() {
    const manager: any = {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn().mockImplementation((_, data) => ({ id: 'new-funding', ...data })),
        save: jest.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
        update: jest.fn().mockResolvedValue(undefined),
    };

    const qb: any = {};
    qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(null);
    manager.createQueryBuilder.mockReturnValue(qb);
    manager._qb = qb;

    return manager;
}

describe('CdpFundingService', () => {
    let service: CdpFundingService;
    let mockCdpRepo: any;
    let mockPositionRepo: any;
    let mockFundingRepo: any;
    let mockCdpProjectRepo: any;
    let mockDetailedActivityRepo: any;
    let mockDataSource: any;
    let mockAuditLog: any;
    let mockQueryRunner: any;
    let mockManager: any;

    beforeEach(() => {
        mockManager = createMockManager();
        mockQueryRunner = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: mockManager,
        };

        mockCdpRepo = {};
        mockPositionRepo = {};
        mockFundingRepo = {
            findOne: jest.fn(),
        };
        mockCdpProjectRepo = {};
        mockDetailedActivityRepo = {};
        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };

        service = new CdpFundingService(
            mockCdpRepo,
            mockPositionRepo,
            mockFundingRepo,
            mockCdpProjectRepo,
            mockDetailedActivityRepo,
            mockDataSource,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('throws BadRequestException when amount <= 0', async () => {
        await expect(service.consumeActivity('pos-1', 'act-1', 0)).rejects.toThrow(BadRequestException);
        await expect(service.consumeActivity('pos-1', 'act-1', -5)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when position not found', async () => {
        mockManager._qb.getOne.mockResolvedValue(null);

        await expect(service.consumeActivity('pos-1', 'act-1', 100)).rejects.toThrow(NotFoundException);
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('throws NotFoundException when activity not found', async () => {
        const position = { id: 'pos-1', cdpId: 'cdp-1', cdp: { id: 'cdp-1' }, positionNumber: 1 };
        mockManager._qb.getOne.mockResolvedValue(position);
        mockManager.findOne
            .mockResolvedValueOnce(null); // activity not found

        await expect(service.consumeActivity('pos-1', 'act-1', 100)).rejects.toThrow(NotFoundException);
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when balance insufficient', async () => {
        const position = { id: 'pos-1', cdpId: 'cdp-1', cdp: { id: 'cdp-1' }, positionNumber: 1 };
        const activity = { id: 'act-1', balance: 50, projectId: 'proj-1', code: 'ACT-001' };
        mockManager._qb.getOne.mockResolvedValue(position);
        mockManager.findOne
            .mockResolvedValueOnce(activity) // activity found
            .mockResolvedValueOnce(null); // cdpProject (won't reach)

        await expect(service.consumeActivity('pos-1', 'act-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when activity not in CDP project', async () => {
        const position = { id: 'pos-1', cdpId: 'cdp-1', cdp: { id: 'cdp-1' }, positionNumber: 1 };
        const activity = { id: 'act-1', balance: 500, projectId: 'proj-1', code: 'ACT-001' };
        mockManager._qb.getOne.mockResolvedValue(position);
        mockManager.findOne
            .mockResolvedValueOnce(activity) // activity
            .mockResolvedValueOnce(null); // cdpProject not found

        await expect(service.consumeActivity('pos-1', 'act-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('creates new funding and updates balances on success', async () => {
        const position = { id: 'pos-1', cdpId: 'cdp-1', cdp: { id: 'cdp-1' }, positionNumber: 1 };
        const activity = { id: 'act-1', balance: 500, projectId: 'proj-1', code: 'ACT-001' };
        const cdpProject = { cdpId: 'cdp-1', projectId: 'proj-1' };
        mockManager._qb.getOne.mockResolvedValue(position);
        mockManager.findOne
            .mockResolvedValueOnce(activity)       // activity
            .mockResolvedValueOnce(cdpProject)     // cdpProject
            .mockResolvedValueOnce(null);          // no existing funding (new)

        mockFundingRepo.findOne.mockResolvedValue({ id: 'new-funding', assignedValue: 100, balance: 100 });

        const result = await service.consumeActivity('pos-1', 'act-1', 100);

        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        expect(mockManager.save).toHaveBeenCalled();
        expect(mockManager.update).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('updates existing funding on repeat consumption', async () => {
        const position = { id: 'pos-1', cdpId: 'cdp-1', cdp: { id: 'cdp-1' }, positionNumber: 1 };
        const activity = { id: 'act-1', balance: 500, projectId: 'proj-1', code: 'ACT-001' };
        const cdpProject = { cdpId: 'cdp-1', projectId: 'proj-1' };
        const existingFunding = { id: 'fund-1', assignedValue: 200, balance: 200, cdpPositionId: 'pos-1', detailedActivityId: 'act-1' };

        mockManager._qb.getOne.mockResolvedValue(position);
        mockManager.findOne
            .mockResolvedValueOnce(activity)
            .mockResolvedValueOnce(cdpProject)
            .mockResolvedValueOnce(existingFunding); // existing funding

        mockFundingRepo.findOne.mockResolvedValue({ id: 'fund-1', assignedValue: 300, balance: 300 });

        const result = await service.consumeActivity('pos-1', 'act-1', 100);

        expect(existingFunding.assignedValue).toBe(300);
        expect(existingFunding.balance).toBe(300);
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
});
