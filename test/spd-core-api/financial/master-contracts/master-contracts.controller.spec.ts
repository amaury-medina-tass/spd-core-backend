import { MasterContractsController } from '../../../../apps/spd-core-api/src/financial/master-contracts/controllers/master-contracts.controller';

describe('MasterContractsController', () => {
    let controller: MasterContractsController;
    let mockService: any;
    let mockCdpPositionsService: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
        };
        mockCdpPositionsService = {
            findForTable: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new MasterContractsController(mockService, mockCdpPositionsService);
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

    describe('findAssociatedCdpPositions', () => {
        it('should delegate to cdpPositionsService', () => {
            controller.findAssociatedCdpPositions('mc-1', 0 as any, 0 as any, '', '', 'ASC');
            expect(mockCdpPositionsService.findForTable).toHaveBeenCalledWith(1, 10, '', '', 'ASC', 'mc-1');
        });
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });
});
