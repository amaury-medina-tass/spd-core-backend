import { NotFoundException } from '@nestjs/common';
import { NeedsService } from '../../../../apps/spd-core-api/src/financial/needs/services/needs.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.innerJoin = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.offset = jest.fn().mockReturnValue(qb);
    qb.limit = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(result ?? null);
    qb.getCount = jest.fn().mockResolvedValue(0);
    qb.getRawOne = jest.fn().mockResolvedValue({ totalValue: '0' });
    qb.getRawMany = jest.fn().mockResolvedValue([]);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

describe('NeedsService', () => {
    let service: NeedsService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
        };
        service = new NeedsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllPaginated', () => {
        it('returns empty page', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated();

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('returns paginated results', async () => {
            const qb = createMockQueryBuilder();
            const needs = [{ id: '1', code: 'N-001' }];
            qb.getManyAndCount.mockResolvedValue([needs, 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated(1, 10);

            expect(result.data).toEqual(needs);
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

            await service.findAllPaginated(1, 10, undefined, 'previousStudy.code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('previousStudy.code', 'ASC');
        });
    });

    describe('findOne', () => {
        it('returns need when found', async () => {
            const need = { id: '1', code: 'N-001' };
            mockRepo.findOne.mockResolvedValue(need);

            const result = await service.findOne('1');

            expect(result).toEqual(need);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findCdpPositionsByNeedId', () => {
        it('returns empty CDP positions', async () => {
            const qb = createMockQueryBuilder();
            qb.getCount.mockResolvedValue(0);
            qb.getRawOne.mockResolvedValue({ totalValue: '0' });
            qb.getRawMany.mockResolvedValue([]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findCdpPositionsByNeedId('1');

            expect(result.data).toEqual([]);
            expect(result.totalValue).toBe(0);
        });

        it('returns mapped CDP positions data', async () => {
            const qb = createMockQueryBuilder();
            qb.getCount.mockResolvedValue(1);
            qb.getRawOne.mockResolvedValue({ totalValue: '5000' });
            qb.getRawMany.mockResolvedValue([{
                projectCode: 'P-001',
                cdpNumber: 'CDP-001',
                fundingSourceCode: 'FS-01',
                fundingSourceName: 'Source',
                cdpTotalValue: '10000',
                positionNumber: 1,
                positionValue: '5000',
                observations: 'test',
            }]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findCdpPositionsByNeedId('1');

            expect(result.totalValue).toBe(5000);
            expect(result.data[0].projectCode).toBe('P-001');
            expect(result.data[0].positionValue).toBe(5000);
        });

        it('applies search filter', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findCdpPositionsByNeedId('1', 1, 10, 'test');

            expect(qb.andWhere).toHaveBeenCalled();
        });

        it('uses custom sort field', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findCdpPositionsByNeedId('1', 1, 10, undefined, 'cdpNumber', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('c.number', 'ASC');
        });
    });
});
