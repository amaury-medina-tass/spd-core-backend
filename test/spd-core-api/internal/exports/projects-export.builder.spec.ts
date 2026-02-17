import { ProjectsExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/projects-export.builder';

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

describe('ProjectsExportBuilder', () => {
    let builder: ProjectsExportBuilder;
    let mockProjectsService: any;
    let mockMgaService: any;
    let mockDetailedService: any;
    let mockCdpProjectRepo: any;
    let mockPoaiPpaRepo: any;

    beforeEach(() => {
        mockProjectsService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ code: 'P001', name: 'Proyecto 1', initialBudget: '1000000', currentBudget: '900000', execution: '500000', origin: 'Nacional', state: 'Activo', dependency: { code: 'D1', name: 'Dep A' } }],
            }),
        };
        mockMgaService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ code: 'MGA-001', name: 'Act MGA', observations: 'obs', project: { code: 'P001', name: 'Proyecto 1' }, value: 100000, balance: 80000, detailedActivitiesCount: 3 }],
            }),
        };
        mockDetailedService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ code: 'DA-001', name: 'Act Det', project: { code: 'P001', name: 'Proyecto 1' }, budgetCeiling: '150000', balance: '120000', cpc: '1234', rubric: { code: 'R001' } }],
            }),
        };
        mockCdpProjectRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { allocatedValue: '50000', project: { code: 'P001', name: 'Proyecto 1' }, cdp: { number: 'CDP-001', totalValue: '80000', balance: '60000', dateIssue: '2024-03-15' } },
                ]),
            ),
        };
        mockPoaiPpaRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { projectCode: 'P001', year: 2024, projectedPoai: '500000', assignedPoai: '400000', project: { code: 'P001', name: 'Proyecto 1' } },
                ]),
            ),
        };

        builder = new ProjectsExportBuilder(
            mockProjectsService,
            mockMgaService,
            mockDetailedService,
            mockCdpProjectRepo as any,
            mockPoaiPpaRepo as any,
        );
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildProjectsExport();
        expect(result.fileName).toMatch(/^proyectos-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 5 sheets with correct names', async () => {
        const result = await builder.buildProjectsExport();
        expect(result.sheets).toHaveLength(5);
        expect(result.sheets[0].name).toBe('Proyectos');
        expect(result.sheets[1].name).toBe('CDPs Asociados');
        expect(result.sheets[2].name).toBe('Actividades MGA');
        expect(result.sheets[3].name).toBe('Actividades Detalladas');
        expect(result.sheets[4].name).toBe('POAI PPA');
    });

    it('should map projects data correctly', async () => {
        const result = await builder.buildProjectsExport();
        const row = result.sheets[0].data[0];
        expect(row.code).toBe('P001');
        expect(row.initialBudget).toBe(1000000);
        expect(row.dependencyCode).toBe('D1');
    });

    it('should map CDP projects data correctly', async () => {
        const result = await builder.buildProjectsExport();
        const row = result.sheets[1].data[0];
        expect(row.projectCode).toBe('P001');
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.allocatedValue).toBe(50000);
    });

    it('should map MGA data correctly', async () => {
        const result = await builder.buildProjectsExport();
        const row = result.sheets[2].data[0];
        expect(row.mgaCode).toBe('MGA-001');
        expect(row.projectCode).toBe('P001');
        expect(row.detailedActivitiesCount).toBe(3);
    });

    it('should map detailed activities data correctly', async () => {
        const result = await builder.buildProjectsExport();
        const row = result.sheets[3].data[0];
        expect(row.activityCode).toBe('DA-001');
        expect(row.budgetCeiling).toBe(150000);
        expect(row.rubricCode).toBe('R001');
    });

    it('should map POAI data correctly', async () => {
        const result = await builder.buildProjectsExport();
        const row = result.sheets[4].data[0];
        expect(row.projectCode).toBe('P001');
        expect(row.year).toBe(2024);
        expect(row.projectedPoai).toBe(500000);
    });

    it('should pass search filter to projects service', async () => {
        await builder.buildProjectsExport({ search: 'test' });
        expect(mockProjectsService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
    });

    it('should handle empty results for all data sources', async () => {
        mockProjectsService.findAllPaginated.mockResolvedValue({ data: [] });
        mockMgaService.findAllPaginated.mockResolvedValue({ data: [] });
        mockDetailedService.findAllPaginated.mockResolvedValue({ data: [] });
        mockCdpProjectRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockPoaiPpaRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        const result = await builder.buildProjectsExport();
        result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
    });

    it('should handle null nested properties', async () => {
        mockProjectsService.findAllPaginated.mockResolvedValue({
            data: [{ code: null, name: null, initialBudget: null, currentBudget: null, execution: null, origin: null, state: null, dependency: null }],
        });
        const result = await builder.buildProjectsExport();
        expect(result.sheets[0].data[0].code).toBe('');
        expect(result.sheets[0].data[0].initialBudget).toBe(0);
        expect(result.sheets[0].data[0].dependencyCode).toBe('');
    });

    it('should have correct column counts per sheet', async () => {
        const result = await builder.buildProjectsExport();
        expect(result.sheets[0].columns).toHaveLength(9);
        expect(result.sheets[1].columns).toHaveLength(7);
        expect(result.sheets[2].columns).toHaveLength(8);
        expect(result.sheets[3].columns).toHaveLength(8);
        expect(result.sheets[4].columns).toHaveLength(5);
    });
});
