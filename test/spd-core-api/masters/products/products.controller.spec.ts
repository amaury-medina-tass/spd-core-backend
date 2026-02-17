import { ProductsController } from '../../../../apps/spd-core-api/src/masters/products/controllers/products.controller';

describe('ProductsController', () => {
    let controller: ProductsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new ProductsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('findForSelect', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForSelect();
            expect(mockService.findForSelect).toHaveBeenCalledWith(undefined, 30, 0);
        });
    });
});
