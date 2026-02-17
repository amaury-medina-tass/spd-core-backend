import { IndicatorsExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/indicators-export.builder';

function createMockQueryBuilder(results: any[] = []) {
    const qb: any = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.addOrderBy = jest.fn().mockReturnValue(qb);
    qb.getMany = jest.fn().mockResolvedValue(results);
    return qb;
}

describe('IndicatorsExportBuilder', () => {
    let builder: IndicatorsExportBuilder;
    let mockActionService: any;
    let mockIndicativeService: any;
    let mockVariablesService: any;
    let mockActionGoalRepo: any;
    let mockActionQuadRepo: any;
    let mockIndicativeGoalRepo: any;
    let mockIndicativeQuadRepo: any;
    let mockProjectRelRepo: any;
    let mockFormulaRepo: any;
    let mockVarGoalRepo: any;
    let mockVarQuadRepo: any;
    let mockVarActionRepo: any;
    let mockVarIndicativeRepo: any;

    const actionRow = { code: 'AP-001', statisticalCode: 'ST-001', name: 'Ind Acción', sequenceNumber: 1, description: 'Desc', plannedQuantity: 100, executionCut: 50, compliancePercentage: 50, observations: 'obs', unitMeasure: { name: 'Unidades' } };
    const indicativeRow = { pillarCode: 'PIL01', pillarName: 'Pilar 1', componentCode: 'CMP01', componentName: 'Comp 1', programCode: 'PRG01', programName: 'Prog 1', code: 'IP-001', name: 'Ind Indicativo', description: 'Desc', baseline: 10, observations: 'obs2', advancePercentage: 40, indicatorType: { name: 'Tipo A' }, unitMeasure: { name: 'Kg' }, direction: { name: 'Ascendente' } };

    beforeEach(() => {
        mockActionService = { findAllPaginated: jest.fn().mockResolvedValue({ data: [actionRow] }) };
        mockIndicativeService = { findAllPaginated: jest.fn().mockResolvedValue({ data: [indicativeRow] }) };
        mockVariablesService = { findAllPaginated: jest.fn().mockResolvedValue({ data: [{ code: 'V001', name: 'Var 1', observations: 'obs' }] }) };

        mockActionGoalRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ year: 2024, value: 100, indicator: { code: 'AP-001', name: 'Ind Acción' } }])) };
        mockActionQuadRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ startYear: 2024, endYear: 2027, value: 400, indicator: { code: 'AP-001', name: 'Ind Acción' } }])) };
        mockIndicativeGoalRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ year: 2024, value: 200, indicator: { code: 'IP-001', name: 'Ind Indicativo' } }])) };
        mockIndicativeQuadRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ startYear: 2024, endYear: 2027, value: 800, indicator: { code: 'IP-001', name: 'Ind Indicativo' } }])) };
        mockProjectRelRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ indicator: { code: 'AP-001', name: 'Ind Acción' }, project: { code: 'P001', name: 'Proy 1' } }])) };
        mockFormulaRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ expression: 'A+B', actionIndicator: { code: 'AP-001', name: 'Ind Acción' }, indicativeIndicator: { code: 'IP-001', name: 'Ind Indicativo' } }])) };
        mockVarGoalRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ year: 2024, value: 50, variable: { code: 'V001', name: 'Var 1' } }])) };
        mockVarQuadRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ startYear: 2024, endYear: 2027, value: 200, variable: { code: 'V001', name: 'Var 1' } }])) };
        mockVarActionRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ variable: { code: 'V001', name: 'Var 1' }, indicator: { code: 'AP-001', name: 'Ind Acción' } }])) };
        mockVarIndicativeRepo = { createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([{ variable: { code: 'V001', name: 'Var 1' }, indicator: { code: 'IP-001', name: 'Ind Indicativo' } }])) };

        builder = new IndicatorsExportBuilder(
            mockActionService,
            mockIndicativeService,
            mockVariablesService,
            mockActionGoalRepo as any,
            mockActionQuadRepo as any,
            mockIndicativeGoalRepo as any,
            mockIndicativeQuadRepo as any,
            mockProjectRelRepo as any,
            mockFormulaRepo as any,
            mockVarGoalRepo as any,
            mockVarQuadRepo as any,
            mockVarActionRepo as any,
            mockVarIndicativeRepo as any,
        );
    });

    describe('buildIndicatorsExport', () => {
        it('should return correct fileName pattern', async () => {
            const result = await builder.buildIndicatorsExport();
            expect(result.fileName).toMatch(/^indicadores-\d{4}-\d{2}-\d{2}\.xlsx$/);
        });

        it('should return 8 sheets with correct names', async () => {
            const result = await builder.buildIndicatorsExport();
            expect(result.sheets).toHaveLength(8);
            expect(result.sheets[0].name).toBe('Plan de Acción');
            expect(result.sheets[1].name).toBe('Plan Indicativo');
            expect(result.sheets[2].name).toBe('Metas Plan Acción');
            expect(result.sheets[3].name).toBe('Cuatrienios Plan Acción');
            expect(result.sheets[4].name).toBe('Metas Plan Indicativo');
            expect(result.sheets[5].name).toBe('Cuatrienios Plan Indicativo');
            expect(result.sheets[6].name).toBe('Fórmulas');
            expect(result.sheets[7].name).toBe('Proyectos Relacionados');
        });

        it('should map action plan data correctly', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[0].data[0];
            expect(row.code).toBe('AP-001');
            expect(row.statisticalCode).toBe('ST-001');
            expect(row.unitMeasure).toBe('Unidades');
            expect(row.plannedQuantity).toBe(100);
        });

        it('should map indicative plan data correctly', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[1].data[0];
            expect(row.code).toBe('IP-001');
            expect(row.pillarCode).toBe('PIL01');
            expect(row.indicatorType).toBe('Tipo A');
            expect(row.direction).toBe('Ascendente');
        });

        it('should map action goals data', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[2].data[0];
            expect(row.indicatorCode).toBe('AP-001');
            expect(row.year).toBe(2024);
            expect(row.value).toBe(100);
        });

        it('should map action quadrenniums data', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[3].data[0];
            expect(row.indicatorCode).toBe('AP-001');
            expect(row.startYear).toBe(2024);
            expect(row.endYear).toBe(2027);
        });

        it('should map formulas data', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[6].data[0];
            expect(row.formula).toBe('A+B');
            expect(row.actionIndicatorCode).toBe('AP-001');
            expect(row.indicativeIndicatorCode).toBe('IP-001');
        });

        it('should map project relations data', async () => {
            const result = await builder.buildIndicatorsExport();
            const row = result.sheets[7].data[0];
            expect(row.indicatorCode).toBe('AP-001');
            expect(row.projectCode).toBe('P001');
        });

        it('should pass search filter', async () => {
            await builder.buildIndicatorsExport({ search: 'test' });
            expect(mockActionService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
            expect(mockIndicativeService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
        });

        it('should handle empty results', async () => {
            mockActionService.findAllPaginated.mockResolvedValue({ data: [] });
            mockIndicativeService.findAllPaginated.mockResolvedValue({ data: [] });
            mockActionGoalRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockActionQuadRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockIndicativeGoalRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockIndicativeQuadRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockFormulaRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockProjectRelRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            const result = await builder.buildIndicatorsExport();
            result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
        });

        it('should have correct column counts', async () => {
            const result = await builder.buildIndicatorsExport();
            expect(result.sheets[0].columns).toHaveLength(10);
            expect(result.sheets[1].columns).toHaveLength(15);
            expect(result.sheets[2].columns).toHaveLength(4);
            expect(result.sheets[3].columns).toHaveLength(5);
            expect(result.sheets[4].columns).toHaveLength(4);
            expect(result.sheets[5].columns).toHaveLength(5);
            expect(result.sheets[6].columns).toHaveLength(5);
            expect(result.sheets[7].columns).toHaveLength(4);
        });

        it('should handle null nested properties in action data', async () => {
            mockActionService.findAllPaginated.mockResolvedValue({
                data: [{ code: null, statisticalCode: null, name: null, sequenceNumber: null, description: null, plannedQuantity: null, executionCut: null, compliancePercentage: null, observations: null, unitMeasure: null }],
            });
            const result = await builder.buildIndicatorsExport();
            expect(result.sheets[0].data[0].code).toBe('');
            expect(result.sheets[0].data[0].unitMeasure).toBe('');
        });
    });

    describe('buildVariablesExport', () => {
        it('should return correct fileName pattern', async () => {
            const result = await builder.buildVariablesExport();
            expect(result.fileName).toMatch(/^variables-\d{4}-\d{2}-\d{2}\.xlsx$/);
        });

        it('should return 5 sheets with correct names', async () => {
            const result = await builder.buildVariablesExport();
            expect(result.sheets).toHaveLength(5);
            expect(result.sheets[0].name).toBe('Variables');
            expect(result.sheets[1].name).toBe('Metas Anuales');
            expect(result.sheets[2].name).toBe('Cuatrienios');
            expect(result.sheets[3].name).toBe('Ind. Plan Acción');
            expect(result.sheets[4].name).toBe('Ind. Plan Indicativo');
        });

        it('should map variables data correctly', async () => {
            const result = await builder.buildVariablesExport();
            const row = result.sheets[0].data[0];
            expect(row.code).toBe('V001');
            expect(row.name).toBe('Var 1');
            expect(row.observations).toBe('obs');
        });

        it('should map variable goals data', async () => {
            const result = await builder.buildVariablesExport();
            const row = result.sheets[1].data[0];
            expect(row.variableCode).toBe('V001');
            expect(row.year).toBe(2024);
            expect(row.value).toBe(50);
        });

        it('should map variable quadrenniums data', async () => {
            const result = await builder.buildVariablesExport();
            const row = result.sheets[2].data[0];
            expect(row.variableCode).toBe('V001');
            expect(row.startYear).toBe(2024);
            expect(row.endYear).toBe(2027);
        });

        it('should map action relations data', async () => {
            const result = await builder.buildVariablesExport();
            const row = result.sheets[3].data[0];
            expect(row.variableCode).toBe('V001');
            expect(row.indicatorCode).toBe('AP-001');
        });

        it('should map indicative relations data', async () => {
            const result = await builder.buildVariablesExport();
            const row = result.sheets[4].data[0];
            expect(row.variableCode).toBe('V001');
            expect(row.indicatorCode).toBe('IP-001');
        });

        it('should pass search filter', async () => {
            await builder.buildVariablesExport({ search: 'test' });
            expect(mockVariablesService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
        });

        it('should handle empty results', async () => {
            mockVariablesService.findAllPaginated.mockResolvedValue({ data: [] });
            mockVarGoalRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockVarQuadRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockVarActionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            mockVarIndicativeRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            const result = await builder.buildVariablesExport();
            result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
        });

        it('should have correct column counts', async () => {
            const result = await builder.buildVariablesExport();
            expect(result.sheets[0].columns).toHaveLength(3);
            expect(result.sheets[1].columns).toHaveLength(4);
            expect(result.sheets[2].columns).toHaveLength(5);
            expect(result.sheets[3].columns).toHaveLength(4);
            expect(result.sheets[4].columns).toHaveLength(4);
        });
    });
});
