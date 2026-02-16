import { VariableQuadrenniumsController } from '../../../../apps/spd-core-api/src/masters/variables/controllers/variable-quadrenniums.controller';

describe('VariableQuadrenniumsController', () => {
    let controller: VariableQuadrenniumsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
        };
        controller = new VariableQuadrenniumsController(mockService);
    });

    it('create() delegates to service', () => {
        const dto = { variableId: 'v1', year: 2024 } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() delegates with defaults', () => {
        controller.findAll('var-1', undefined as any, undefined as any, '', '', 'DESC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('var-1', 1, 10, '', '', 'DESC');
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
