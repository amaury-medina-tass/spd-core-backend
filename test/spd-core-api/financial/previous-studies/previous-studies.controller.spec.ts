import { PreviousStudiesController } from '../../../../apps/spd-core-api/src/financial/previous-studies/controllers/previous-studies.controller';

describe('PreviousStudiesController', () => {
    let controller: PreviousStudiesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new PreviousStudiesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });

        it('should pass provided values', () => {
            controller.findAll(2, 20, 'test', 'col', 'DESC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(2, 20, 'test', 'col', 'DESC');
        });
    });
});
