import { CdpPositionsController } from '../../../../apps/spd-core-api/src/financial/cdps/controllers/cdp-positions.controller';

describe('CdpPositionsController', () => {
    let controller: CdpPositionsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findByCdpId: jest.fn().mockResolvedValue([]),
            findForTable: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            updateObservations: jest.fn().mockResolvedValue({ id: '1' }),
            getDetailedActivitiesForPosition: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            associateActivity: jest.fn().mockResolvedValue({ success: true }),
            disassociateActivity: jest.fn().mockResolvedValue(undefined),
        };
        controller = new CdpPositionsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findByCdpId', () => {
        it('should delegate to service', () => {
            controller.findByCdpId('cdp-1', 'search');
            expect(mockService.findByCdpId).toHaveBeenCalledWith('cdp-1', 'search');
        });
    });

    describe('findForTable', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForTable(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findForTable).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });

        it('should pass provided values', () => {
            controller.findForTable(3, 25, 'term', 'col', 'DESC');
            expect(mockService.findForTable).toHaveBeenCalledWith(3, 25, 'term', 'col', 'DESC');
        });
    });

    describe('findOne', () => {
        it('should use defaults for optional params', () => {
            controller.findOne('id-1');
            expect(mockService.findOne).toHaveBeenCalledWith('id-1', 1, 10, undefined);
        });

        it('should pass optional params', () => {
            controller.findOne('id-1', 2, 5, 'act');
            expect(mockService.findOne).toHaveBeenCalledWith('id-1', 2, 5, 'act');
        });
    });

    describe('updateObservations', () => {
        it('should delegate to service', () => {
            controller.updateObservations('id-1', 'obs text');
            expect(mockService.updateObservations).toHaveBeenCalledWith('id-1', 'obs text');
        });
    });

    describe('getDetailedActivitiesForPosition', () => {
        it('should use defaults', () => {
            controller.getDetailedActivitiesForPosition('pos-1');
            expect(mockService.getDetailedActivitiesForPosition).toHaveBeenCalledWith('pos-1', 'all', 1, 20, undefined);
        });

        it('should pass provided values', () => {
            controller.getDetailedActivitiesForPosition('pos-1', 'associated', 2, 10, 'term');
            expect(mockService.getDetailedActivitiesForPosition).toHaveBeenCalledWith('pos-1', 'associated', 2, 10, 'term');
        });
    });

    describe('associateActivity', () => {
        it('should delegate to service', () => {
            controller.associateActivity('pos-1', 'act-1');
            expect(mockService.associateActivity).toHaveBeenCalledWith('pos-1', 'act-1');
        });
    });

    describe('disassociateActivity', () => {
        it('should delegate to service', () => {
            controller.disassociateActivity('pos-1', 'act-1');
            expect(mockService.disassociateActivity).toHaveBeenCalledWith('pos-1', 'act-1');
        });
    });
});
