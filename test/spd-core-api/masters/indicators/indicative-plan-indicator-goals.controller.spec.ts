import { IndicativePlanIndicatorGoalsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/indicative-plan/indicative-plan-indicator-goals.controller';

describe('IndicativePlanIndicatorGoalsController', () => {
    let controller: IndicativePlanIndicatorGoalsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
        };
        controller = new IndicativePlanIndicatorGoalsController(mockService);
    });

    it('create() delegates to service', () => {
        const dto = { indicatorId: 'ind-1', year: 2024 } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() delegates with defaults', () => {
        controller.findAll('ind-1', undefined as any, undefined as any, '', '', 'DESC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('ind-1', 1, 10, '', '', 'DESC');
    });

    it('findOne() delegates to service', () => {
        controller.findOne('1');
        expect(mockService.findOne).toHaveBeenCalledWith('1');
    });

    it('update() delegates to service', () => {
        controller.update('1', { goal: 200 } as any);
        expect(mockService.update).toHaveBeenCalledWith('1', expect.objectContaining({ goal: 200 }));
    });

    it('remove() delegates to service', () => {
        controller.remove('1');
        expect(mockService.remove).toHaveBeenCalledWith('1');
    });
});
