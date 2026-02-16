import { SubUserFilterService } from '../../../apps/spd-core-api/src/sub/services/sub-user-filter.service';

function createMockQueryBuilder() {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

describe('SubUserFilterService', () => {
    let service: SubUserFilterService;
    let indicativeUserRepo: any;
    let actionUserRepo: any;
    let indicativeRepo: any;
    let actionRepo: any;
    let variableUserRepo: any;
    let variableRepo: any;

    beforeEach(() => {
        indicativeUserRepo = { find: jest.fn().mockResolvedValue([]) };
        actionUserRepo = { find: jest.fn().mockResolvedValue([]) };
        indicativeRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()) };
        actionRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()) };
        variableUserRepo = { find: jest.fn().mockResolvedValue([]) };
        variableRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()) };

        service = new SubUserFilterService(
            indicativeUserRepo,
            actionUserRepo,
            indicativeRepo,
            actionRepo,
            variableUserRepo,
            variableRepo,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getIndicativeIndicatorsByUser', () => {
        it('returns empty response when no assignments', async () => {
            const result = await service.getIndicativeIndicatorsByUser('user-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('returns indicators when user has assignments', async () => {
            indicativeUserRepo.find.mockResolvedValue([{ indicatorId: 'ind-1' }, { indicatorId: 'ind-2' }]);
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: 'ind-1' }], 1]);
            indicativeRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getIndicativeIndicatorsByUser('user-1');

            expect(result.data.length).toBe(1);
            expect(result.meta.total).toBe(1);
        });

        it('applies search filter', async () => {
            indicativeUserRepo.find.mockResolvedValue([{ indicatorId: 'ind-1' }]);
            const qb = createMockQueryBuilder();
            indicativeRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getIndicativeIndicatorsByUser('user-1', 1, 10, 'test');

            expect(qb.andWhere).toHaveBeenCalled();
        });

        it('sorts by relation field', async () => {
            indicativeUserRepo.find.mockResolvedValue([{ indicatorId: 'ind-1' }]);
            const qb = createMockQueryBuilder();
            indicativeRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getIndicativeIndicatorsByUser('user-1', 1, 10, undefined, 'indicatorType.name', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('indicatorType.name', 'ASC');
        });
    });

    describe('getActionIndicatorsByUser', () => {
        it('returns empty response when no assignments', async () => {
            const result = await service.getActionIndicatorsByUser('user-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('returns indicators when user has assignments', async () => {
            actionUserRepo.find.mockResolvedValue([{ indicatorId: 'act-1' }]);
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: 'act-1' }], 1]);
            actionRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getActionIndicatorsByUser('user-1');

            expect(result.data.length).toBe(1);
        });

        it('applies search filter', async () => {
            actionUserRepo.find.mockResolvedValue([{ indicatorId: 'act-1' }]);
            const qb = createMockQueryBuilder();
            actionRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getActionIndicatorsByUser('user-1', 1, 10, 'test');

            expect(qb.andWhere).toHaveBeenCalled();
        });
    });

    describe('getVariablesByUser', () => {
        it('returns empty response when no assignments', async () => {
            const result = await service.getVariablesByUser('user-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('returns variables when user has assignments', async () => {
            variableUserRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: 'var-1' }], 1]);
            variableRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getVariablesByUser('user-1');

            expect(result.data.length).toBe(1);
        });

        it('applies search filter', async () => {
            variableUserRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const qb = createMockQueryBuilder();
            variableRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getVariablesByUser('user-1', 1, 10, 'test');

            expect(qb.andWhere).toHaveBeenCalled();
        });

        it('sorts by valid field', async () => {
            variableUserRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const qb = createMockQueryBuilder();
            variableRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getVariablesByUser('user-1', 1, 10, undefined, 'code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('variable.code', 'ASC');
        });
    });
});
