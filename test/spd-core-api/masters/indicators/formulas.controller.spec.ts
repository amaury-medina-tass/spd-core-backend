import { FormulasController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/formulas.controller';

describe('FormulasController', () => {
    let controller: FormulasController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            findDataForCalculator: jest.fn().mockResolvedValue({}),
        };
        controller = new FormulasController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { expression: 'x + y' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('update should delegate to service', () => {
        const dto = { expression: 'x * y' } as any;
        controller.update('id-1', dto);
        expect(mockService.update).toHaveBeenCalledWith('id-1', dto);
    });

    it('findData should delegate to service', () => {
        controller.findData('ind-1', 'action', 2024);
        expect(mockService.findDataForCalculator).toHaveBeenCalledWith('ind-1', 'action', 2024);
    });
});
