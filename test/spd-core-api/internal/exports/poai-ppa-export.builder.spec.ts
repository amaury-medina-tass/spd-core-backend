import { PoaiPpaExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/poai-ppa-export.builder';

describe('PoaiPpaExportBuilder', () => {
    let builder: PoaiPpaExportBuilder;
    let mockPoaiPpaService: any;
    let mockProjectsService: any;

    beforeEach(() => {
        mockPoaiPpaService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [
                    { projectCode: 'P001', project: { code: 'P001', name: 'Proyecto 1' }, year: 2024, projectedPoai: '500000', assignedPoai: '400000' },
                ],
                meta: { totalItems: 1 },
            }),
        };
        mockProjectsService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [
                    { code: 'P001', name: 'Proyecto 1', initialBudget: '1000000', currentBudget: '900000', execution: '500000', origin: 'Nacional', state: 'Activo', dependency: { code: 'D1', name: 'Dep A' } },
                ],
                meta: { totalItems: 1 },
            }),
        };

        builder = new PoaiPpaExportBuilder(mockPoaiPpaService, mockProjectsService);
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildPoaiPpaExport();
        expect(result.fileName).toMatch(/^poai-ppa-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 2 sheets', async () => {
        const result = await builder.buildPoaiPpaExport();
        expect(result.sheets).toHaveLength(2);
        expect(result.sheets[0].name).toBe('POAI PPA');
        expect(result.sheets[1].name).toBe('Proyectos');
    });

    it('should map POAI data correctly', async () => {
        const result = await builder.buildPoaiPpaExport();
        const row = result.sheets[0].data[0];
        expect(row.projectCode).toBe('P001');
        expect(row.projectName).toBe('Proyecto 1');
        expect(row.year).toBe(2024);
        expect(row.projectedPoai).toBe(500000);
        expect(row.assignedPoai).toBe(400000);
    });

    it('should map projects data correctly', async () => {
        const result = await builder.buildPoaiPpaExport();
        const row = result.sheets[1].data[0];
        expect(row.code).toBe('P001');
        expect(row.dependencyCode).toBe('D1');
        expect(row.dependencyName).toBe('Dep A');
    });

    it('should pass search filter to service', async () => {
        await builder.buildPoaiPpaExport({ search: 'test' });
        expect(mockPoaiPpaService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'projectCode', 'ASC');
    });

    it('should handle empty results', async () => {
        mockPoaiPpaService.findAllPaginated.mockResolvedValue({ data: [] });
        mockProjectsService.findAllPaginated.mockResolvedValue({ data: [] });
        const result = await builder.buildPoaiPpaExport();
        expect(result.sheets[0].data).toEqual([]);
        expect(result.sheets[1].data).toEqual([]);
    });

    it('should handle missing nested properties', async () => {
        mockPoaiPpaService.findAllPaginated.mockResolvedValue({
            data: [{ projectCode: null, project: null, year: null, projectedPoai: null, assignedPoai: null }],
        });
        const result = await builder.buildPoaiPpaExport();
        const row = result.sheets[0].data[0];
        expect(row.projectCode).toBe('');
        expect(row.projectedPoai).toBe(0);
    });

    it('should have correct column counts', async () => {
        const result = await builder.buildPoaiPpaExport();
        expect(result.sheets[0].columns).toHaveLength(5);
        expect(result.sheets[1].columns).toHaveLength(9);
    });
});
