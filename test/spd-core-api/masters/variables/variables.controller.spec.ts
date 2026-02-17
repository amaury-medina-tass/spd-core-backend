import { VariablesController } from '../../../../apps/spd-core-api/src/masters/variables/controllers/variables.controller';

describe('VariablesController', () => {
    let controller: VariablesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        controller = new VariablesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { code: 'V-01' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findForSelect', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForSelect();
            expect(mockService.findForSelect).toHaveBeenCalledWith(undefined, 30, 0);
        });
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
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
