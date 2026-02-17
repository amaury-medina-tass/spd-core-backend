import { DashboardExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/dashboard-export.builder';

describe('DashboardExportBuilder', () => {
    let builder: DashboardExportBuilder;
    let mockDashboardService: any;

    beforeEach(() => {
        mockDashboardService = {
            getGlobalData: jest.fn().mockResolvedValue({
                totalInitialBudget: '1000000',
                totalCurrentBudget: '900000',
                totalExecution: '500000',
                totalProjects: 5,
                totalAdditions: '100000',
                totalReductions: '50000',
                totalTransfers: '20000',
                totalNeeds: 10,
                totalCdps: 8,
                totalContracts: 3,
            }),
            getProjectBudgetOverview: jest.fn().mockResolvedValue([
                { code: 'P001', name: 'Proyecto 1', initialBudget: '500000', currentBudget: '450000', execution: '200000', available: '250000', executionPercentage: '44.44', dependencyName: 'Dep A' },
            ]),
            getProjectExecutionOverview: jest.fn().mockResolvedValue({
                data: [
                    { code: 'P001', name: 'Proyecto 1', initialBudget: '500000', currentBudget: '450000', execution: '200000', executionPercentage: '44.44', dependencyName: 'Dep A', mgaActivitiesCount: 3 },
                ],
            }),
        };

        builder = new DashboardExportBuilder(mockDashboardService);
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildFinancialDashboardExport();
        expect(result.fileName).toMatch(/^dashboard-financiero-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 3 sheets', async () => {
        const result = await builder.buildFinancialDashboardExport();
        expect(result.sheets).toHaveLength(3);
        expect(result.sheets[0].name).toBe('Resumen Global');
        expect(result.sheets[1].name).toBe('Panorama Presupuestal');
        expect(result.sheets[2].name).toBe('Ejecución por Proyecto');
    });

    it('should map global data to Resumen Global sheet', async () => {
        const result = await builder.buildFinancialDashboardExport();
        const sheet = result.sheets[0];
        expect(sheet.columns).toHaveLength(2);
        expect(sheet.data.length).toBeGreaterThanOrEqual(9);
        expect(sheet.data[0]).toEqual({ metric: 'Presupuesto Inicial Total', value: 1000000 });
        expect(sheet.data[3]).toEqual({ metric: 'Total Proyectos', value: 5 });
    });

    it('should map budget overview data correctly', async () => {
        const result = await builder.buildFinancialDashboardExport();
        const sheet = result.sheets[1];
        expect(sheet.columns).toHaveLength(8);
        expect(sheet.data[0].code).toBe('P001');
        expect(sheet.data[0].initialBudget).toBe(500000);
        expect(sheet.data[0].dependencyName).toBe('Dep A');
    });

    it('should map execution overview data correctly', async () => {
        const result = await builder.buildFinancialDashboardExport();
        const sheet = result.sheets[2];
        expect(sheet.columns).toHaveLength(8);
        expect(sheet.data[0].code).toBe('P001');
        expect(sheet.data[0].mgaActivitiesCount).toBe(3);
    });

    it('should handle null/undefined global data values', async () => {
        mockDashboardService.getGlobalData.mockResolvedValue({});
        const result = await builder.buildFinancialDashboardExport();
        const sheet = result.sheets[0];
        expect(sheet.data[0].value).toBe(0);
        expect(sheet.data[3].value).toBe(0);
    });

    it('should handle empty budget overview', async () => {
        mockDashboardService.getProjectBudgetOverview.mockResolvedValue([]);
        const result = await builder.buildFinancialDashboardExport();
        expect(result.sheets[1].data).toEqual([]);
    });

    it('should handle empty execution overview', async () => {
        mockDashboardService.getProjectExecutionOverview.mockResolvedValue({ data: [] });
        const result = await builder.buildFinancialDashboardExport();
        expect(result.sheets[2].data).toEqual([]);
    });

    it('should call dashboard service methods', async () => {
        await builder.buildFinancialDashboardExport();
        expect(mockDashboardService.getGlobalData).toHaveBeenCalled();
        expect(mockDashboardService.getProjectBudgetOverview).toHaveBeenCalled();
        expect(mockDashboardService.getProjectExecutionOverview).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER);
    });

    it('should handle missing nested properties in budget data', async () => {
        mockDashboardService.getProjectBudgetOverview.mockResolvedValue([
            { code: null, name: null, initialBudget: null, currentBudget: null, execution: null, available: null, executionPercentage: null, dependencyName: null },
        ]);
        const result = await builder.buildFinancialDashboardExport();
        const row = result.sheets[1].data[0];
        expect(row.code).toBe('');
        expect(row.initialBudget).toBe(0);
    });
});
