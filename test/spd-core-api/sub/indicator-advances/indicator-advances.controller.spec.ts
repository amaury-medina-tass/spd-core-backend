import { IndicatorAdvancesController } from '../../../../apps/spd-core-api/src/sub/indicator-advances/controllers/indicator-advances.controller';

describe('IndicatorAdvancesController', () => {
    let controller: IndicatorAdvancesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            getIndicatorDetails: jest.fn().mockResolvedValue({}),
        };
        controller = new IndicatorAdvancesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getIndicatorDetails should delegate to service', async () => {
        const query = { year: 2024, month: 6 } as any;
        await controller.getIndicatorDetails('action', 'ind-1', query);
        expect(mockService.getIndicatorDetails).toHaveBeenCalledWith('ind-1', 'action', 2024, 6);
    });
});
