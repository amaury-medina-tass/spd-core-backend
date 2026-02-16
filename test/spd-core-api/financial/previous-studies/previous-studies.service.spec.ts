import { PreviousStudiesService } from '../../../../apps/spd-core-api/src/financial/previous-studies/services/previous-studies.service';

describe('PreviousStudiesService', () => {
    let service: PreviousStudiesService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
        };
        service = new PreviousStudiesService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAllPaginated() returns empty page', async () => {
        const result = await service.findAllPaginated();

        expect(result).toEqual({
            data: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        });
    });

    it('findAllPaginated() returns data with meta', async () => {
        const items = [{ id: '1', code: 'PS-01', status: 'ACTIVE' }];
        mockRepo.findAndCount.mockResolvedValue([items, 1]);

        const result = await service.findAllPaginated(1, 10);

        expect(result.data).toEqual(items);
        expect(result.meta.total).toBe(1);
        expect(result.meta.totalPages).toBe(1);
    });

    it('findAllPaginated() with search filters by code and status', async () => {
        mockRepo.findAndCount.mockResolvedValue([[], 0]);

        await service.findAllPaginated(1, 10, 'test');

        expect(mockRepo.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.arrayContaining([
                    expect.objectContaining({ code: expect.anything() }),
                    expect.objectContaining({ status: expect.anything() }),
                ]),
            }),
        );
    });

    it('findAllPaginated() respects sortBy and sortOrder', async () => {
        mockRepo.findAndCount.mockResolvedValue([[], 0]);

        await service.findAllPaginated(1, 5, undefined, 'code', 'ASC');

        expect(mockRepo.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({
                order: { code: 'ASC' },
                skip: 0,
                take: 5,
            }),
        );
    });

    it('findAllPaginated() defaults invalid sortBy to createAt', async () => {
        mockRepo.findAndCount.mockResolvedValue([[], 0]);

        await service.findAllPaginated(1, 10, undefined, 'invalid');

        expect(mockRepo.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({
                order: { createAt: 'DESC' },
            }),
        );
    });

    it('findAllPaginated() page 2 computes correct pagination', async () => {
        const items = [{ id: '2' }];
        mockRepo.findAndCount.mockResolvedValue([items, 15]);

        const result = await service.findAllPaginated(2, 10);

        expect(result.meta.page).toBe(2);
        expect(result.meta.totalPages).toBe(2);
        expect(result.meta.hasNextPage).toBe(false);
        expect(result.meta.hasPreviousPage).toBe(true);
    });
});
