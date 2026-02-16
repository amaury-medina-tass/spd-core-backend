import { IndicativePlanIndicatorLocationsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/indicative-plan/indicative-plan-indicator-locations.controller';

describe('IndicativePlanIndicatorLocationsController', () => {
    let controller: IndicativePlanIndicatorLocationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            addLocationToIndicativeIndicator: jest.fn().mockResolvedValue({ id: '1' }),
            findByIndicativeIndicator: jest.fn().mockResolvedValue([]),
            removeLocationFromIndicativeIndicator: jest.fn().mockResolvedValue({ message: 'removed' }),
            findIndicativeIndicatorsByCommuneCode: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findVariablesByIndicativeIndicatorLocation: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new IndicativePlanIndicatorLocationsController(mockService);
    });

    it('addLocation() delegates to service', () => {
        controller.addLocation('ind-1', { locationId: 'loc-1' } as any);
        expect(mockService.addLocationToIndicativeIndicator).toHaveBeenCalledWith('ind-1', 'loc-1');
    });

    it('findAll() delegates to service', () => {
        controller.findAll('ind-1');
        expect(mockService.findByIndicativeIndicator).toHaveBeenCalledWith('ind-1');
    });

    it('removeLocation() delegates to service', () => {
        controller.removeLocation('ind-1', 'loc-1');
        expect(mockService.removeLocationFromIndicativeIndicator).toHaveBeenCalledWith('ind-1', 'loc-1');
    });

    it('findByCommuneCode() coerces page/limit', () => {
        controller.findByCommuneCode('COM01', '2', '5', 'test');
        expect(mockService.findIndicativeIndicatorsByCommuneCode).toHaveBeenCalledWith('COM01', 2, 5, 'test');
    });

    it('findVariablesByLocation() delegates correctly', () => {
        controller.findVariablesByLocation('ind-1', '1', '10', 'test');
        expect(mockService.findVariablesByIndicativeIndicatorLocation).toHaveBeenCalledWith('ind-1', 1, 10, 'test');
    });
});
