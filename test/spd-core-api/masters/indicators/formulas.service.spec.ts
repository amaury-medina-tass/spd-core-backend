import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FormulasService } from '../../../../apps/spd-core-api/src/masters/indicators/services/formulas.service';

describe('FormulasService', () => {
    let service: FormulasService;
    let mockIndicativeIndicatorRepo: any;
    let mockActionIndicatorRepo: any;
    let mockVariableActionRelationRepo: any;
    let mockVariableIndicativeRelationRepo: any;
    let mockVariableGoalRepo: any;
    let mockVariableQuadrenniumRepo: any;
    let mockFormulaRepo: any;
    let mockVariableAdvancesService: any;
    let mockAuditLog: any;

    const mockFormula = { id: 'f-1', expression: 'A + B', indicativeIndicatorId: 'ind-1', actionIndicatorId: null };

    beforeEach(() => {
        mockIndicativeIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 'ind-1', code: 'IND001', name: 'Indicator 1',
                unitMeasure: { id: 'um-1', name: 'Unit1' },
                indicatorType: { id: 'it-1', name: 'Type1' },
                direction: { id: 'dir-1', name: 'Dir1' },
                formulas: [],
            }),
            manager: {
                find: jest.fn().mockResolvedValue([]),
            },
        };
        mockActionIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 'ind-2', code: 'ACT001', name: 'Action Indicator',
                unitMeasure: { id: 'um-1', name: 'Unit1' },
                formulas: [],
            }),
            manager: {
                find: jest.fn().mockResolvedValue([]),
            },
        };
        mockVariableActionRelationRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockVariableIndicativeRelationRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockVariableGoalRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockVariableQuadrenniumRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockFormulaRepo = {
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'f-1' })),
            preload: jest.fn().mockResolvedValue(mockFormula),
        };
        mockVariableAdvancesService = {
            recalculateForFormula: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new FormulasService(
            mockIndicativeIndicatorRepo,
            mockActionIndicatorRepo,
            mockVariableActionRelationRepo,
            mockVariableIndicativeRelationRepo,
            mockVariableGoalRepo,
            mockVariableQuadrenniumRepo,
            mockFormulaRepo,
            mockVariableAdvancesService,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a formula with indicativeIndicatorId', async () => {
            const dto = { expression: 'A + B', indicativeIndicatorId: 'ind-1' } as any;

            const result = await service.create(dto);

            expect(mockFormulaRepo.create).toHaveBeenCalledWith(dto);
            expect(mockFormulaRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(mockVariableAdvancesService.recalculateForFormula).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should create a formula with actionIndicatorId', async () => {
            const dto = { expression: 'X * Y', actionIndicatorId: 'ind-2' } as any;

            const result = await service.create(dto);

            expect(mockFormulaRepo.create).toHaveBeenCalledWith(dto);
            expect(mockFormulaRepo.save).toHaveBeenCalled();
        });

        it('should throw BadRequestException if both indicator ids are provided', async () => {
            const dto = { indicativeIndicatorId: 'ind-1', actionIndicatorId: 'ind-2' } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if neither indicator id is provided', async () => {
            const dto = { expression: 'A + B' } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('update', () => {
        it('should update a formula and trigger recalculation', async () => {
            const dto = { expression: 'A - B' } as any;
            mockFormulaRepo.preload.mockResolvedValue({ ...mockFormula, expression: 'A - B' });
            mockFormulaRepo.save.mockResolvedValue({ ...mockFormula, expression: 'A - B' });

            const result = await service.update('f-1', dto);

            expect(mockFormulaRepo.preload).toHaveBeenCalledWith({ id: 'f-1', ...dto });
            expect(mockFormulaRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(mockVariableAdvancesService.recalculateForFormula).toHaveBeenCalled();
        });

        it('should throw NotFoundException if formula not found', async () => {
            mockFormulaRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { expression: 'X' } as any))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findDataForCalculator', () => {
        it('should return action plan data when type is action', async () => {
            const result = await service.findDataForCalculator('ind-2', 'action', 2024);

            expect(mockActionIndicatorRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'ind-2' },
                relations: ['unitMeasure', 'formulas'],
            });
            expect(result).toHaveProperty('indicator');
            expect(result).toHaveProperty('variables');
        });

        it('should return indicative plan data when type is indicative', async () => {
            const result = await service.findDataForCalculator('ind-1', 'indicative', 2024);

            expect(mockIndicativeIndicatorRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'ind-1' },
                relations: ['unitMeasure', 'indicatorType', 'direction', 'formulas'],
            });
            expect(result).toHaveProperty('indicator');
            expect(result).toHaveProperty('variables');
        });

        it('should throw BadRequestException for invalid type', async () => {
            await expect(service.findDataForCalculator('ind-1', 'invalid' as any, 2024))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if action indicator not found', async () => {
            mockActionIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findDataForCalculator('bad-id', 'action', 2024))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if indicative indicator not found', async () => {
            mockIndicativeIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findDataForCalculator('bad-id', 'indicative', 2024))
                .rejects.toThrow(NotFoundException);
        });

        it('should fetch variable goals and quadrenniums when variables exist (action)', async () => {
            mockVariableActionRelationRepo.find.mockResolvedValue([
                { variableId: 'var-1', variable: { id: 'var-1', code: 'V001', name: 'Var 1' } },
            ]);

            const result = await service.findDataForCalculator('ind-2', 'action', 2024);

            expect(mockVariableGoalRepo.find).toHaveBeenCalled();
            expect(mockVariableQuadrenniumRepo.find).toHaveBeenCalled();
            expect(result.variables).toHaveLength(1);
            expect(result.variables[0]).toHaveProperty('goals');
            expect(result.variables[0]).toHaveProperty('quadrenniums');
        });

        it('should fetch variable goals and quadrenniums when variables exist (indicative)', async () => {
            mockVariableIndicativeRelationRepo.find.mockResolvedValue([
                { variableId: 'var-1', variable: { id: 'var-1', code: 'V001', name: 'Var 1' } },
            ]);

            const result = await service.findDataForCalculator('ind-1', 'indicative', 2024);

            expect(mockVariableGoalRepo.find).toHaveBeenCalled();
            expect(mockVariableQuadrenniumRepo.find).toHaveBeenCalled();
            expect(result.variables).toHaveLength(1);
        });

        it('should not fetch variable data when no variable relations exist', async () => {
            mockVariableActionRelationRepo.find.mockResolvedValue([]);

            const result = await service.findDataForCalculator('ind-2', 'action', 2024);

            expect(mockVariableGoalRepo.find).not.toHaveBeenCalled();
            expect(result.variables).toHaveLength(0);
        });
    });
});
