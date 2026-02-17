import { ActionPlanIndicatorsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/action-plan-indicators.controller';

describe('ActionPlanIndicatorsController', () => {
    let controller: ActionPlanIndicatorsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        controller = new ActionPlanIndicatorsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { code: 'IND-01' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll should delegate to service with defaults', () => {
        controller.findAll();
        expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });

    it('update should delegate to service', () => {
        const dto = { name: 'Updated' } as any;
        controller.update('id-1', dto);
        expect(mockService.update).toHaveBeenCalledWith('id-1', dto);
    });

    it('remove should delegate to service', () => {
        controller.remove('id-1');
        expect(mockService.remove).toHaveBeenCalledWith('id-1');
    });
});
