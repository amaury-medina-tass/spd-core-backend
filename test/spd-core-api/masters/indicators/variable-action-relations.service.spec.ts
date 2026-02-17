import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VariableActionRelationsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/action-plan/variable-action-relations.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('VariableActionRelationsService', () => {
    let service: VariableActionRelationsService;
    let mockRelationRepo: any;
    let mockIndicatorRepo: any;
    let mockVariableRepo: any;
    let mockFormulaRepo: any;
    let mockVariableAdvancesService: any;
    let mockAuditLog: any;

    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };
    const mockVariable = { id: 'var-1', code: 'V001', name: 'Variable 1' };
    const mockRelation = { id: 'rel-1', variableId: 'var-1', indicatorId: 'ind-1' };

    beforeEach(() => {
        mockRelationRepo = {
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'rel-1' })),
            findOne: jest.fn().mockResolvedValue(mockRelation),
            find: jest.fn().mockResolvedValue([]),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
        };
        mockVariableRepo = {
            findOne: jest.fn().mockResolvedValue(mockVariable),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([mockVariable], 1)),
        };
        mockFormulaRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockVariableAdvancesService = {
            recalculateForFormula: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariableActionRelationsService(
            mockRelationRepo,
            mockIndicatorRepo,
            mockVariableRepo,
            mockFormulaRepo,
            mockVariableAdvancesService,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('associate', () => {
        it('should associate a variable with an action indicator', async () => {
            const result = await service.associate('ind-1', 'var-1');

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockRelationRepo.create).toHaveBeenCalledWith({ variableId: 'var-1', indicatorId: 'ind-1' });
            expect(mockRelationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.associate('bad-id', 'var-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRelationRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.associate('ind-1', 'var-1')).rejects.toThrow(BadRequestException);
        });

        it('should recalculate formulas after association', async () => {
            mockFormulaRepo.find.mockResolvedValue([{ id: 'f-1', actionIndicatorId: 'ind-1' }]);

            await service.associate('ind-1', 'var-1');

            expect(mockFormulaRepo.find).toHaveBeenCalledWith({ where: { actionIndicatorId: 'ind-1' } });
            expect(mockVariableAdvancesService.recalculateForFormula).toHaveBeenCalled();
        });
    });

    describe('disassociate', () => {
        it('should disassociate a variable from an indicator', async () => {
            await service.disassociate('ind-1', 'var-1');

            expect(mockRelationRepo.findOne).toHaveBeenCalledWith({ where: { variableId: 'var-1', indicatorId: 'ind-1' } });
            expect(mockRelationRepo.remove).toHaveBeenCalledWith(mockRelation);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockRelationRepo.findOne.mockResolvedValue(null);

            await expect(service.disassociate('ind-1', 'var-1')).rejects.toThrow(NotFoundException);
        });

        it('should recalculate formulas after disassociation', async () => {
            mockFormulaRepo.find.mockResolvedValue([{ id: 'f-1', actionIndicatorId: 'ind-1' }]);

            await service.disassociate('ind-1', 'var-1');

            expect(mockVariableAdvancesService.recalculateForFormula).toHaveBeenCalled();
        });
    });

    describe('findPaginated', () => {
        it('should return paginated associated variables', async () => {
            mockRelationRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const mockQb = createMockQueryBuilder([mockVariable], 1);
            mockVariableRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'associated');

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should return empty response for associated when no relations', async () => {
            mockRelationRepo.find.mockResolvedValue([]);

            const result = await service.findPaginated('ind-1', 'associated');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return available variables', async () => {
            mockRelationRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const mockQb = createMockQueryBuilder([{ id: 'var-2' }], 1);
            mockVariableRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'available');

            expect(mockQb.where).toHaveBeenCalled();
            expect(result.data).toBeDefined();
        });

        it('should return all variables with isAssociated flag', async () => {
            mockRelationRepo.find.mockResolvedValue([{ variableId: 'var-1' }]);
            const mockQb = createMockQueryBuilder([{ id: 'var-1' }], 1);
            mockVariableRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'all');

            expect(result.data[0]).toHaveProperty('isAssociated');
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findPaginated('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('should apply search filter', async () => {
            mockRelationRepo.find.mockResolvedValue([]);
            const mockQb = createMockQueryBuilder([], 0);
            mockVariableRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findPaginated('ind-1', 'all', 1, 20, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });
    });
});
