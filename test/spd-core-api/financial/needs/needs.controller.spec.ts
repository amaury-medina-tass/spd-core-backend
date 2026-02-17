import { NeedsController } from '../../../../apps/spd-core-api/src/financial/needs/controllers/needs.controller';

describe('NeedsController', () => {
    let controller: NeedsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            findCdpPositionsByNeedId: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new NeedsController(mockService);
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

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });

    describe('getCdpPositionsByNeedId', () => {
        it('should use defaults when params are falsy', () => {
            controller.getCdpPositionsByNeedId('need-1', 0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findCdpPositionsByNeedId).toHaveBeenCalledWith('need-1', 1, 10, '', '', 'ASC');
        });
    });
});
