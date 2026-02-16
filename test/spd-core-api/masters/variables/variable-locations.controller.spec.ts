import { VariableLocationsController } from '../../../../apps/spd-core-api/src/masters/variables/controllers/variable-locations.controller';

describe('VariableLocationsController', () => {
    let controller: VariableLocationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            addLocation: jest.fn().mockResolvedValue({ id: '1' }),
            findByVariable: jest.fn().mockResolvedValue([]),
            removeLocation: jest.fn().mockResolvedValue({ message: 'removed' }),
        };
        controller = new VariableLocationsController(mockService);
    });

    it('addLocation() delegates to service', () => {
        controller.addLocation('var-1', { locationId: 'loc-1' } as any);
        expect(mockService.addLocation).toHaveBeenCalledWith('var-1', 'loc-1');
    });

    it('findAll() delegates to service', () => {
        controller.findAll('var-1');
        expect(mockService.findByVariable).toHaveBeenCalledWith('var-1');
    });

    it('removeLocation() delegates to service', () => {
        controller.removeLocation('var-1', 'loc-1');
        expect(mockService.removeLocation).toHaveBeenCalledWith('var-1', 'loc-1');
    });
});
