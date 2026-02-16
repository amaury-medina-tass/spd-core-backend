import { IndicativePlanIndicatorsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/indicative-plan/indicative-plan-indicators.controller';

describe('IndicativePlanIndicatorsController', () => {
    let controller: IndicativePlanIndicatorsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            getCatalogs: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        controller = new IndicativePlanIndicatorsController(mockService);
    });

    describe('findAll', () => {
        it('should cap limit at 100', () => {
            controller.findAll(1, 200, undefined, undefined, undefined);
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 100, undefined, undefined, undefined);
        });

        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, undefined, undefined, undefined);
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
        });
    });

    describe('findAllCatalogs', () => {
        it('should delegate to service', () => {
            controller.findAllCatalogs();
            expect(mockService.getCatalogs).toHaveBeenCalled();
        });
    });
});
