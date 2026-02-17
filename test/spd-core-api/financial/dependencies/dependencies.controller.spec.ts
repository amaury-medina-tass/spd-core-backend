import { DependenciesController } from '../../../../apps/spd-core-api/src/financial/dependencies/controllers/dependencies.controller';

describe('DependenciesController', () => {
    let controller: DependenciesController;
    let mockService: any;

    beforeEach(() => {
        mockService = { findAll: jest.fn().mockResolvedValue([]) };
        controller = new DependenciesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll should delegate to service', () => {
        controller.findAll('test');
        expect(mockService.findAll).toHaveBeenCalledWith('test');
    });
});
