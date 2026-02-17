import { ProjectsController } from '../../../../apps/spd-core-api/src/financial/projects/controllers/projects.controller';

describe('ProjectsController', () => {
    let controller: ProjectsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
        };
        controller = new ProjectsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { name: 'Project A' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('findForSelect', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForSelect('', 0 as any, 0 as any);
            expect(mockService.findForSelect).toHaveBeenCalledWith('', 30, 0);
        });
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });
});
