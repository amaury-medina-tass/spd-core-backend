import { ProductsService } from '../../../../apps/spd-core-api/src/masters/products/services/products.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('ProductsService', () => {
    let service: ProductsService;
    let mockRepo: any;
    let mockQb: any;

    beforeEach(() => {
        mockQb = createMockQueryBuilder([{ id: '1', productCode: 'P001' }], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            findOneBy: jest.fn().mockResolvedValue({ id: '1', productCode: 'P001' }),
        };
        service = new ProductsService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated();

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('product');
            expect(mockQb.orderBy).toHaveBeenCalledWith('product.createAt', 'DESC');
            expect(mockQb.skip).toHaveBeenCalledWith(0);
            expect(mockQb.take).toHaveBeenCalledWith(10);
            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated(1, 10, 'test');

            expect(mockQb.where).toHaveBeenCalled();
        });

        it('should apply valid sortBy and sortOrder', async () => {
            await service.findAllPaginated(1, 10, undefined, 'productCode', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('product.productCode', 'ASC');
        });

        it('should use default sortBy for invalid field', async () => {
            await service.findAllPaginated(1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('product.createAt', 'DESC');
        });

        it('should calculate pagination meta correctly', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated(2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('findForSelect', () => {
        it('should return select data with meta', async () => {
            const result = await service.findForSelect();

            expect(mockQb.select).toHaveBeenCalled();
            expect(mockQb.orderBy).toHaveBeenCalledWith('product.productName', 'ASC');
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
        });

        it('should apply search when provided', async () => {
            await service.findForSelect('test');

            expect(mockQb.where).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a product by id', async () => {
            const result = await service.findOne('1');

            expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: '1' });
            expect(result).toBeDefined();
        });
    });
});
