import { ActionPlanIndicatorGoalsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/action-plan-indicator-goals.controller';

describe('ActionPlanIndicatorGoalsController', () => {
    let controller: ActionPlanIndicatorGoalsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
        };
        controller = new ActionPlanIndicatorGoalsController(mockService);
    });

    it('create() delegates to service', () => {
        const dto = { indicatorId: 'ind-1', year: 2024, goal: 100 } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() delegates with coerced params', () => {
        controller.findAll('ind-1', 2, 5, 'test', 'year', 'ASC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('ind-1', 2, 5, 'test', 'year', 'ASC');
    });

    it('findAll() uses defaults for undefined page/limit', () => {
        controller.findAll('ind-1', undefined as any, undefined as any, '', '', 'DESC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('ind-1', 1, 10, '', '', 'DESC');
    });

    it('findOne() delegates to service', () => {
        controller.findOne('1');
        expect(mockService.findOne).toHaveBeenCalledWith('1');
    });

    it('update() delegates to service', () => {
        const dto = { goal: 200 } as any;
        controller.update('1', dto);
        expect(mockService.update).toHaveBeenCalledWith('1', dto);
    });

    it('remove() delegates to service', () => {
        controller.remove('1');
        expect(mockService.remove).toHaveBeenCalledWith('1');
    });
});
