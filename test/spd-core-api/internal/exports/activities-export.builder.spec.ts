import { ActivitiesExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/activities-export.builder';

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

describe('ActivitiesExportBuilder', () => {
    let builder: ActivitiesExportBuilder;
    let mockMgaService: any;
    let mockDetailedService: any;
    let mockProductsService: any;
    let mockProjectsService: any;
    let mockRelationRepo: any;

    const mgaRow = { code: 'MGA-001', name: 'Act MGA', observations: 'obs', project: { code: 'P001', name: 'Proy 1' }, product: { productCode: 'PR001', productName: 'Prod 1' }, value: 100000, balance: 80000, detailedActivitiesCount: 3 };
    const detailedRow = { code: 'DA-001', name: 'Act Det', observations: 'obs2', activityDate: '2024-01-01', budgetCeiling: '150000', balance: '120000', cpc: '1234', project: { code: 'P001', name: 'Proy 1' }, rubric: { code: 'R001', accountName: 'Rubric 1' } };
    const relRow = { id: 1, mgaActivity: { code: 'MGA-001', name: 'Act MGA' }, detailedActivity: { code: 'DA-001', name: 'Act Det' } };
    const productRow = { productCode: 'PR001', productName: 'Prod 1', indicatorCode: 'IND01', indicatorName: 'Ind 1', measuredUnit: 'Kg', unitType: 'Peso', isMainIndicator: true };
    const projectRow = { code: 'P001', name: 'Proy 1', initialBudget: '1000000', currentBudget: '900000', execution: '500000', origin: 'Nacional', state: 'Activo', dependency: { code: 'D1', name: 'Dep A' } };

    beforeEach(() => {
        mockMgaService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [mgaRow] }),
        };
        mockDetailedService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [detailedRow] }),
        };
        mockProductsService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [productRow] }),
        };
        mockProjectsService = {
            findAllPaginated: jest.fn().mockResolvedValue({ data: [projectRow] }),
        };
        mockRelationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([relRow])),
        };

        builder = new ActivitiesExportBuilder(
            mockMgaService,
            mockDetailedService,
            mockProductsService,
            mockProjectsService,
            mockRelationRepo as any,
        );
    });

    describe('buildMgaActivitiesExport', () => {
        it('should return correct fileName pattern', async () => {
            const result = await builder.buildMgaActivitiesExport();
            expect(result.fileName).toMatch(/^actividades-mga-\d{4}-\d{2}-\d{2}\.xlsx$/);
        });

        it('should return 1 sheet named Actividades MGA', async () => {
            const result = await builder.buildMgaActivitiesExport();
            expect(result.sheets).toHaveLength(1);
            expect(result.sheets[0].name).toBe('Actividades MGA');
        });

        it('should map MGA data correctly', async () => {
            const result = await builder.buildMgaActivitiesExport();
            const row = result.sheets[0].data[0];
            expect(row.code).toBe('MGA-001');
            expect(row.projectCode).toBe('P001');
            expect(row.productCode).toBe('PR001');
            expect(row.value).toBe(100000);
            expect(row.detailedActivitiesCount).toBe(3);
        });

        it('should have 10 columns', async () => {
            const result = await builder.buildMgaActivitiesExport();
            expect(result.sheets[0].columns).toHaveLength(10);
        });

        it('should pass search filter', async () => {
            await builder.buildMgaActivitiesExport({ search: 'test' });
            expect(mockMgaService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
        });

        it('should handle empty results', async () => {
            mockMgaService.findAllPaginated.mockResolvedValue({ data: [] });
            const result = await builder.buildMgaActivitiesExport();
            expect(result.sheets[0].data).toEqual([]);
        });

        it('should handle null nested properties', async () => {
            mockMgaService.findAllPaginated.mockResolvedValue({
                data: [{ code: null, name: null, observations: null, project: null, product: null, value: null, balance: null, detailedActivitiesCount: null }],
            });
            const result = await builder.buildMgaActivitiesExport();
            const row = result.sheets[0].data[0];
            expect(row.code).toBe('');
            expect(row.projectCode).toBe('');
            expect(row.productCode).toBe('');
        });
    });

    describe('buildActivitiesExport', () => {

        it('should return correct fileName pattern', async () => {
            const result = await builder.buildActivitiesExport();
            expect(result.fileName).toMatch(/^reporte-actividades-completo-\d{4}-\d{2}-\d{2}\.xlsx$/);
        });

        it('should return 5 sheets with correct names', async () => {
            const result = await builder.buildActivitiesExport();
            expect(result.sheets).toHaveLength(5);
            expect(result.sheets[0].name).toBe('Actividades MGA');
            expect(result.sheets[1].name).toBe('Actividades Detalladas');
            expect(result.sheets[2].name).toBe('Relaciones MGA-Detalladas');
            expect(result.sheets[3].name).toBe('Productos');
            expect(result.sheets[4].name).toBe('Proyectos');
        });

        it('should map detailed activities data', async () => {
            const result = await builder.buildActivitiesExport();
            const row = result.sheets[1].data[0];
            expect(row.code).toBe('DA-001');
            expect(row.budgetCeiling).toBe('150000');
            expect(row.rubricCode).toBe('R001');
        });

        it('should map relations data', async () => {
            const result = await builder.buildActivitiesExport();
            const row = result.sheets[2].data[0];
            expect(row.mgaCode).toBe('MGA-001');
            expect(row.detailedCode).toBe('DA-001');
        });

        it('should map products data with isMainIndicator as Sí/No', async () => {
            const result = await builder.buildActivitiesExport();
            const row = result.sheets[3].data[0];
            expect(row.productCode).toBe('PR001');
            expect(row.isMainIndicator).toBe('Sí');
        });

        it('should map projects data', async () => {
            const result = await builder.buildActivitiesExport();
            const row = result.sheets[4].data[0];
            expect(row.code).toBe('P001');
            expect(row.dependencyCode).toBe('D1');
        });

        it('should call all services', async () => {
            await builder.buildActivitiesExport();
            expect(mockMgaService.findAllPaginated).toHaveBeenCalled();
            expect(mockDetailedService.findAllPaginated).toHaveBeenCalled();
            expect(mockProductsService.findAllPaginated).toHaveBeenCalled();
            expect(mockProjectsService.findAllPaginated).toHaveBeenCalled();
            expect(mockRelationRepo.createQueryBuilder).toHaveBeenCalledWith('rel');
        });

        it('should handle empty results', async () => {
            mockMgaService.findAllPaginated.mockResolvedValue({ data: [] });
            mockDetailedService.findAllPaginated.mockResolvedValue({ data: [] });
            mockProductsService.findAllPaginated.mockResolvedValue({ data: [] });
            mockProjectsService.findAllPaginated.mockResolvedValue({ data: [] });
            mockRelationRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
            const result = await builder.buildActivitiesExport();
            result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
        });

        it('should have correct column counts', async () => {
            const result = await builder.buildActivitiesExport();
            expect(result.sheets[0].columns).toHaveLength(10);
            expect(result.sheets[1].columns).toHaveLength(11);
            expect(result.sheets[2].columns).toHaveLength(4);
            expect(result.sheets[3].columns).toHaveLength(7);
            expect(result.sheets[4].columns).toHaveLength(9);
        });
    });
});
