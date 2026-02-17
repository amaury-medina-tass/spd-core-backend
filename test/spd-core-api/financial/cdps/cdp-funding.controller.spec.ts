import { CdpFundingController } from '../../../../apps/spd-core-api/src/financial/cdps/controllers/cdp-funding.controller';

describe('CdpFundingController', () => {
    let controller: CdpFundingController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            consumeActivity: jest.fn().mockResolvedValue({ success: true }),
        };
        controller = new CdpFundingController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('consumeActivity should delegate to service with numeric amount', () => {
        controller.consumeActivity('pos-1', 'act-1', 500);
        expect(mockService.consumeActivity).toHaveBeenCalledWith('pos-1', 'act-1', 500);
    });
});
