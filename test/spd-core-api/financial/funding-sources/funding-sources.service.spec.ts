import { NotFoundException } from '@nestjs/common';
import { FundingSourcesService } from '../../../../apps/spd-core-api/src/financial/funding-sources/services/funding-sources.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(result ?? null);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

describe('FundingSourcesService', () => {
    let service: FundingSourcesService;
    let mockRepo: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({ id: 'new-id', ...dto })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'new-id', ...entity })),
            findOne: jest.fn(),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new FundingSourcesService(mockRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('creates a funding source', async () => {
            const dto = { code: 'FS-01', name: 'Source A' };
            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith({ code: 'FS-01', name: 'Source A' });
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ code: 'FS-01' }));
        });
    });

    describe('findAllPaginated', () => {
        it('returns empty paginated result', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated();

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('applies search filter', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, 'test');

            expect(qb.where).toHaveBeenCalled();
        });

        it('validates sort order defaults', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('fundingSource.code', 'ASC');
        });
    });

    describe('findOne', () => {
        it('returns funding source when found', async () => {
            const fs = { id: '1', code: 'FS-01', name: 'Source A' };
            mockRepo.findOne.mockResolvedValue(fs);

            const result = await service.findOne('1');
            expect(result).toEqual(fs);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findForSelect', () => {
        it('returns data with select meta', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: '1', code: 'FS-01', name: 'A' }], 1]);
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

            expect(qb.where).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('updates a funding source', async () => {
            const existing = { id: '1', code: 'FS-01', name: 'Old' };
            mockRepo.findOne.mockResolvedValue(existing);

            const result = await service.update('1', { code: 'FS-02', name: 'New' });

            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('throws NotFoundException when source not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.update('none', { name: 'X' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('deletes a funding source', async () => {
            const existing = { id: '1', code: 'FS-01', name: 'A' };
            mockRepo.findOne.mockResolvedValue(existing);

            const result = await service.delete('1');

            expect(mockRepo.remove).toHaveBeenCalledWith(existing);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.message).toContain('eliminada');
        });
    });
});
