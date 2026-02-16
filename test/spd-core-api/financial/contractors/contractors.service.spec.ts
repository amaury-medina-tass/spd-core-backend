import { ContractorsService } from '../../../../apps/spd-core-api/src/financial/contractors/services/contractors.service';

describe('ContractorsService', () => {
    let service: ContractorsService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        service = new ContractorsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll() should return all contractors without search', async () => {
        const contractors = [{ id: '1', name: 'ACME', nit: '123' }];
        mockRepo.find.mockResolvedValue(contractors);

        const result = await service.findAll();

        expect(mockRepo.find).toHaveBeenCalledWith({
            where: {},
            order: { name: 'ASC' },
            take: 50,
        });
        expect(result).toEqual(contractors);
    });

    it('findAll() should filter by search term', async () => {
        await service.findAll('ACME');

        expect(mockRepo.find).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.arrayContaining([
                    expect.objectContaining({ nit: expect.anything() }),
                    expect.objectContaining({ name: expect.anything() }),
                ]),
            }),
        );
    });
});
