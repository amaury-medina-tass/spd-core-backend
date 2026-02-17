import { BudgetModificationsController } from '../../../../apps/spd-core-api/src/masters/budget-modifications/controllers/budget-modifications.controller';

describe('BudgetModificationsController', () => {
    let controller: BudgetModificationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
        };
        controller = new BudgetModificationsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { type: 'ADICION' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC', '');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC', '');
        });
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });
});
