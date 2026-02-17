import { RubricsController } from '../../../../apps/spd-core-api/src/masters/rubrics/controllers/rubrics.controller';

describe('RubricsController', () => {
    let controller: RubricsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new RubricsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findForSelect should use defaults when params are falsy', () => {
        controller.findForSelect('', 0 as any, 0 as any);
        expect(mockService.findForSelect).toHaveBeenCalledWith('', 30, 0);
    });

    it('findForSelect should pass provided values', () => {
        controller.findForSelect('test', 50, 10);
        expect(mockService.findForSelect).toHaveBeenCalledWith('test', 50, 10);
    });
});
