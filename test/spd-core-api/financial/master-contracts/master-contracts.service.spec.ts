import { NotFoundException } from '@nestjs/common';
import { MasterContractsService } from '../../../../apps/spd-core-api/src/financial/master-contracts/services/master-contracts.service';

function createMockQueryBuilder(result?: any) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
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

describe('MasterContractsService', () => {
    let service: MasterContractsService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = { createQueryBuilder: jest.fn() };
        service = new MasterContractsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllPaginated', () => {
        it('returns paginated results', async () => {
            const qb = createMockQueryBuilder();
            const contracts = [{ id: '1', number: 'MC-001' }];
            qb.getManyAndCount.mockResolvedValue([contracts, 1]);
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAllPaginated();

            expect(result.data).toEqual(contracts);
            expect(result.meta.total).toBe(1);
        });

        it('applies search', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, 'search');

            expect(qb.where).toHaveBeenCalled();
        });

        it('sorts by relation field', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'contractor.name', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('contractor.name', 'ASC');
        });

        it('defaults invalid sort', async () => {
            const qb = createMockQueryBuilder();
            mockRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAllPaginated(1, 10, undefined, 'invalid');

            expect(qb.orderBy).toHaveBeenCalledWith('masterContract.createAt', 'DESC');
        });
    });

    describe('findOne', () => {
        it('returns contract when found', async () => {
            const mc = { id: '1', number: 'MC-001' };
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(mc));

            const result = await service.findOne('1');

            expect(result).toEqual(mc);
        });

        it('throws NotFoundException when not found', async () => {
            mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });
});
