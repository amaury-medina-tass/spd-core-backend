import { LocationsController } from '../../../../apps/spd-core-api/src/masters/locations/controllers/locations.controller';

describe('LocationsController', () => {
    let controller: LocationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new LocationsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { address: 'Calle 1' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findForSelect should use defaults when params are falsy', () => {
        controller.findForSelect();
        expect(mockService.findForSelect).toHaveBeenCalledWith(undefined, undefined, 30, 0);
    });

    it('findForSelect should pass provided values', () => {
        controller.findForSelect('test', 'commune-1', 50, 10);
        expect(mockService.findForSelect).toHaveBeenCalledWith('test', 'commune-1', 50, 10);
    });
});
