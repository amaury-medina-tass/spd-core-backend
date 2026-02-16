import { VariableGoalsController } from '../../../../apps/spd-core-api/src/masters/variables/controllers/variable-goals.controller';

describe('VariableGoalsController', () => {
    let controller: VariableGoalsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
        };
        controller = new VariableGoalsController(mockService);
    });

    it('create() delegates to service', () => {
        const dto = { variableId: 'v1', year: 2024, goal: 100 } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() delegates with defaults', () => {
        controller.findAll('var-1', undefined as any, undefined as any, '', '', 'DESC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('var-1', 1, 10, '', '', 'DESC');
    });

    it('findAll() delegates with custom params', () => {
        controller.findAll('var-1', 2, 5, 'test', 'year', 'ASC');
        expect(mockService.findAllPaginated).toHaveBeenCalledWith('var-1', 2, 5, 'test', 'year', 'ASC');
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
