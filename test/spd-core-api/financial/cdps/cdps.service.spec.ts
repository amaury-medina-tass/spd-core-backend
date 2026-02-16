import { NotFoundException } from '@nestjs/common';
import { CdpsService } from '../../../../apps/spd-core-api/src/financial/cdps/services/cdps.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.orWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(result ?? null);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

describe('CdpsService', () => {
    let service: CdpsService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = { createQueryBuilder: jest.fn() };
        service = new CdpsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllPaginated', () => {
        it('returns empty page', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder());

            const result = await service.findAllPaginated();

            expect(result.data).toEqual([]);
            expect(result.meta).toEqual(
                expect.objectContaining({ total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false }),
            );
        });

        it('returns data with pagination', async () => {
            const qb = createMockQueryBuilder();
            const cdps = [{ id: '1', number: 'CDP-001' }];
            qb.getManyAndCount.mockResolvedValue([cdps, 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated(1, 10);

            expect(result.data).toEqual(cdps);
            expect(result.meta.total).toBe(1);
        });

        it('applies search filter', async () => {
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

        it('defaults invalid sort field', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'invalid');

            expect(qb.orderBy).toHaveBeenCalledWith('cdp.createAt', 'DESC');
        });
    });

    describe('findOne', () => {
        it('returns CDP when found', async () => {
            const cdp = { id: '1', number: 'CDP-001' };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(cdp));

            const result = await service.findOne('1');

            expect(result).toEqual(cdp);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findForSelect', () => {
        it('returns data with meta', async () => {
            const qb = createMockQueryBuilder();
            const data = [{ id: '1', number: 'CDP-001' }];
            qb.getManyAndCount.mockResolvedValue([data, 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findForSelect();

            expect(result.data).toEqual(data);
            expect(result.meta.total).toBe(1);
            expect(result.meta.hasMore).toBe(false);
        });

        it('applies search filter', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findForSelect('test');

            expect(qb.where).toHaveBeenCalled();
        });
    });
});
