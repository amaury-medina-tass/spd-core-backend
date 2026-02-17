import { CdpsController } from '../../../../apps/spd-core-api/src/financial/cdps/controllers/cdps.controller';

describe('CdpsController', () => {
    let controller: CdpsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
        };
        controller = new CdpsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });

        it('should pass numeric values', () => {
            controller.findAll(2, 20, 'test', 'code', 'DESC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(2, 20, 'test', 'code', 'DESC');
        });
    });

    describe('findForSelect', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForSelect('', 0 as any, 0 as any);
            expect(mockService.findForSelect).toHaveBeenCalledWith('', 30, 0);
        });

        it('should pass provided values', () => {
            controller.findForSelect('abc', 50, 10);
            expect(mockService.findForSelect).toHaveBeenCalledWith('abc', 50, 10);
        });
    });

    describe('findOne', () => {
        it('should delegate to service', () => {
            controller.findOne('uuid-1');
            expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
        });
    });
});
