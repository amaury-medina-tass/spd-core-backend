import { CommunesService } from '../../../../apps/spd-core-api/src/masters/locations/services/communes.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('CommunesService', () => {
    let service: CommunesService;
    let mockRepo: any;
    let mockQb: any;

    beforeEach(() => {
        mockQb = createMockQueryBuilder([{ id: '1', code: '001', name: 'Comuna 1' }], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
        };
        service = new CommunesService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findForSelect should return data with meta', async () => {
        const result = await service.findForSelect();

        expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('commune');
        expect(mockQb.select).toHaveBeenCalled();
        expect(mockQb.orderBy).toHaveBeenCalledWith('CAST(commune.code AS INTEGER)', 'ASC');
        expect(mockQb.skip).toHaveBeenCalledWith(0);
        expect(mockQb.take).toHaveBeenCalledWith(30);
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('findForSelect with search should apply where clause', async () => {
        await service.findForSelect('test');

        expect(mockQb.where).toHaveBeenCalled();
    });

    it('findForSelect should respect limit and offset', async () => {
        await service.findForSelect(undefined, 5, 10);

        expect(mockQb.skip).toHaveBeenCalledWith(10);
        expect(mockQb.take).toHaveBeenCalledWith(5);
    });

    it('findForSelect should report hasMore when more records exist', async () => {
        mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 50]);

        const result = await service.findForSelect(undefined, 10, 0);

        expect(result.meta.hasMore).toBe(true);
    });
});
