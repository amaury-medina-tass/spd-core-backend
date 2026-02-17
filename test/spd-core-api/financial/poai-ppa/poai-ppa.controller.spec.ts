import { PoaiPpaController } from '../../../../apps/spd-core-api/src/financial/poai-ppa/controllers/poai-ppa.controller';

describe('PoaiPpaController', () => {
    let controller: PoaiPpaController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            getYearlyTrends: jest.fn().mockResolvedValue([]),
            findYearComparisonByProject: jest.fn().mockResolvedValue([]),
            getBudgetSummaryByProject: jest.fn().mockResolvedValue({}),
            getProjectBudgetEvolution: jest.fn().mockResolvedValue([]),
            findByProjectAndYear: jest.fn().mockResolvedValue({ id: '1' }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        controller = new PoaiPpaController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { projectId: 'p1' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC', 0 as any, '');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC', undefined, '');
        });

        it('should convert year to number', () => {
            controller.findAll(1, 10, '', '', 'ASC', 2024, 'p1');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC', 2024, 'p1');
        });
    });

    describe('getYearlyTrends', () => {
        it('should convert years to numbers', () => {
            controller.getYearlyTrends(2020, 2024);
            expect(mockService.getYearlyTrends).toHaveBeenCalledWith(2020, 2024);
        });

        it('should pass undefined when params are falsy', () => {
            controller.getYearlyTrends(0 as any, 0 as any);
            expect(mockService.getYearlyTrends).toHaveBeenCalledWith(undefined, undefined);
        });
    });

    it('findYearComparisonByProject should delegate', () => {
        controller.findYearComparisonByProject('p1');
        expect(mockService.findYearComparisonByProject).toHaveBeenCalledWith('p1');
    });

    it('getBudgetSummaryByProject should delegate', () => {
        controller.getBudgetSummaryByProject('p1');
        expect(mockService.getBudgetSummaryByProject).toHaveBeenCalledWith('p1');
    });

    it('getProjectBudgetEvolution should delegate', () => {
        controller.getProjectBudgetEvolution('p1');
        expect(mockService.getProjectBudgetEvolution).toHaveBeenCalledWith('p1');
    });

    it('findByProjectAndYear should convert year to number', () => {
        controller.findByProjectAndYear('p1', 2024);
        expect(mockService.findByProjectAndYear).toHaveBeenCalledWith('p1', 2024);
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });

    it('update should delegate to service', () => {
        const dto = { year: 2024 } as any;
        controller.update('id-1', dto);
        expect(mockService.update).toHaveBeenCalledWith('id-1', dto);
    });

    it('remove should delegate to service', () => {
        controller.remove('id-1');
        expect(mockService.remove).toHaveBeenCalledWith('id-1');
    });
});
