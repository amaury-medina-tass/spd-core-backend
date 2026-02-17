import { RubricsService } from '../../../../apps/spd-core-api/src/masters/rubrics/services/rubrics.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('RubricsService', () => {
    let service: RubricsService;
    let mockRepo: any;
    let mockQb: any;

    beforeEach(() => {
        mockQb = createMockQueryBuilder([{ id: '1', code: 'R001' }], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
        };
        service = new RubricsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findForSelect should return data with meta', async () => {
        const result = await service.findForSelect();

        expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('rubric');
        expect(mockQb.select).toHaveBeenCalled();
        expect(mockQb.orderBy).toHaveBeenCalledWith('rubric.code', 'ASC');
        expect(mockQb.skip).toHaveBeenCalledWith(0);
        expect(mockQb.take).toHaveBeenCalledWith(30);
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
        expect(result.meta.hasMore).toBe(false);
    });

    it('findForSelect with search should apply where clause', async () => {
        await service.findForSelect('test', 10, 5);

        expect(mockQb.where).toHaveBeenCalled();
        expect(mockQb.skip).toHaveBeenCalledWith(5);
        expect(mockQb.take).toHaveBeenCalledWith(10);
    });

    it('findForSelect should report hasMore correctly', async () => {
        mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 50]);

        const result = await service.findForSelect(undefined, 10, 0);

        expect(result.meta.hasMore).toBe(true);
    });
});
