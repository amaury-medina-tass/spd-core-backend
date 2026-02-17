import { CommunesController } from '../../../../apps/spd-core-api/src/masters/locations/controllers/communes.controller';

describe('CommunesController', () => {
    let controller: CommunesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new CommunesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findForSelect should use defaults when params are falsy', () => {
        controller.findForSelect();
        expect(mockService.findForSelect).toHaveBeenCalledWith(undefined, 30, 0);
    });

    it('findForSelect should pass provided values', () => {
        controller.findForSelect('test', 50, 10);
        expect(mockService.findForSelect).toHaveBeenCalledWith('test', 50, 10);
    });
});
