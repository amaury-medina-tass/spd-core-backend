import { ActionPlanIndicatorLocationsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/action-plan-indicator-locations.controller';

describe('ActionPlanIndicatorLocationsController', () => {
    let controller: ActionPlanIndicatorLocationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            addLocationToActionIndicator: jest.fn().mockResolvedValue({ id: '1' }),
            findByActionIndicator: jest.fn().mockResolvedValue([]),
            removeLocationFromActionIndicator: jest.fn().mockResolvedValue({ message: 'removed' }),
            findActionIndicatorsByCommuneCode: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findVariablesByActionIndicatorLocation: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new ActionPlanIndicatorLocationsController(mockService);
    });

    it('addLocation() delegates to service', () => {
        controller.addLocation('ind-1', { locationId: 'loc-1' } as any);
        expect(mockService.addLocationToActionIndicator).toHaveBeenCalledWith('ind-1', 'loc-1');
    });

    it('findAll() delegates to service', () => {
        controller.findAll('ind-1');
        expect(mockService.findByActionIndicator).toHaveBeenCalledWith('ind-1');
    });

    it('removeLocation() delegates to service', () => {
        controller.removeLocation('ind-1', 'loc-1');
        expect(mockService.removeLocationFromActionIndicator).toHaveBeenCalledWith('ind-1', 'loc-1');
    });

    it('findByCommuneCode() coerces page/limit', () => {
        controller.findByCommuneCode('COM01', '2', '5', 'test');
        expect(mockService.findActionIndicatorsByCommuneCode).toHaveBeenCalledWith('COM01', 2, 5, 'test');
    });

    it('findVariablesByLocation() delegates correctly', () => {
        controller.findVariablesByLocation('ind-1', '1', '10', 'test');
        expect(mockService.findVariablesByActionIndicatorLocation).toHaveBeenCalledWith('ind-1', 1, 10, 'test');
    });
});
