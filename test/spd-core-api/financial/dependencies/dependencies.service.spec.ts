import { DependenciesService } from '../../../../apps/spd-core-api/src/financial/dependencies/services/dependencies.service';

describe('DependenciesService', () => {
    let service: DependenciesService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
        };
        service = new DependenciesService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findOneByCode() should return a dependency by code', async () => {
        const dep = { id: '1', code: 'DEP-01', name: 'Dep 1' };
        mockRepo.findOne.mockResolvedValue(dep);

        const result = await service.findOneByCode('DEP-01');

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { code: 'DEP-01' } });
        expect(result).toEqual(dep);
    });

    it('findOneByCode() should return null when not found', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        const result = await service.findOneByCode('NONE');
        expect(result).toBeNull();
    });

    it('findOne() should return a dependency by id', async () => {
        const dep = { id: 'abc', code: 'DEP-01', name: 'Dep 1' };
        mockRepo.findOne.mockResolvedValue(dep);

        const result = await service.findOne('abc');

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'abc' } });
        expect(result).toEqual(dep);
    });

    it('findAll() without search returns all', async () => {
        const deps = [{ id: '1', code: 'A', name: 'Alpha' }];
        mockRepo.find.mockResolvedValue(deps);

        const result = await service.findAll();

        expect(mockRepo.find).toHaveBeenCalledWith({
            where: {},
            order: { name: 'ASC' },
        });
        expect(result).toEqual(deps);
    });

    it('findAll() with search filters by code and name', async () => {
        await service.findAll('Alpha');

        expect(mockRepo.find).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.arrayContaining([
                    expect.objectContaining({ code: expect.anything() }),
                    expect.objectContaining({ name: expect.anything() }),
                ]),
            }),
        );
    });
});
