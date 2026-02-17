import { IndicativePlanIndicatorQuadrenniumsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/indicative-plan/indicative-plan-indicator-quadrenniums.controller';

describe('IndicativePlanIndicatorQuadrenniumsController', () => {
    let controller: IndicativePlanIndicatorQuadrenniumsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllByParent: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
        };
        controller = new IndicativePlanIndicatorQuadrenniumsController(mockService);
    });

    it('create() delegates to service', () => {
        const dto = { indicatorId: 'i1', year: 2024 } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAllByIndicator() delegates to service', () => {
        controller.findAllByIndicator('ind-1');
        expect(mockService.findAllByParent).toHaveBeenCalledWith('ind-1');
    });

    it('findOne() delegates to service', () => {
        controller.findOne('1');
        expect(mockService.findOne).toHaveBeenCalledWith('1');
    });

    it('update() delegates to service', () => {
        controller.update('1', { year: 2025 } as any);
        expect(mockService.update).toHaveBeenCalledWith('1', expect.objectContaining({ year: 2025 }));
    });

    it('remove() delegates to service', () => {
        controller.remove('1');
        expect(mockService.remove).toHaveBeenCalledWith('1');
    });
});
