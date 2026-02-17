import { CdpExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/cdp-export.builder';

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

describe('CdpExportBuilder', () => {
    let builder: CdpExportBuilder;
    let mockCdpPositionsService: any;
    let mockCdpRepo: any;
    let mockFundingRepo: any;
    let mockCdpRelationRepo: any;
    let mockCdpProjectRepo: any;

    beforeEach(() => {
        mockCdpPositionsService = {
            findForTable: jest.fn().mockResolvedValue({
                data: [{ cdpNumber: 'CDP-001', positionNumber: 1, rubricCode: 'R001', projectCode: 'P001', needCode: 'N001', positionValue: 50000, cdpTotalValue: 80000, fundingSourceName: 'FS1', fundingSourceCode: 'FSC1', observations: 'obs' }],
            }),
        };
        mockCdpRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { id: 1, number: 'CDP-001', totalValue: '80000', balance: '60000', dateIssue: '2024-03-15' },
                ]),
            ),
        };
        mockFundingRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { id: 1, assignedValue: '30000', balance: '25000', cdpPosition: { cdp: { number: 'CDP-001' }, positionNumber: 1 }, detailedActivity: { code: 'DA-001', name: 'Act 1', project: { code: 'P001' }, rubric: { code: 'R001' } } },
                ]),
            ),
        };
        mockCdpRelationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { id: 1, cdp: { number: 'CDP-001' }, masterContract: { number: 'MC-001', object: 'Obj 1', totalValue: '100000', state: 'Activo' }, need: { code: 'N001', description: 'Need 1' } },
                ]),
            ),
        };
        mockCdpProjectRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { id: 1, cdp: { number: 'CDP-001' }, project: { code: 'P001', name: 'Proyecto 1' }, allocatedValue: '50000' },
                ]),
            ),
        };

        builder = new CdpExportBuilder(
            mockCdpPositionsService,
            mockCdpRepo as any,
            mockFundingRepo as any,
            mockCdpRelationRepo as any,
            mockCdpProjectRepo as any,
        );
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildCdpExport();
        expect(result.fileName).toMatch(/^reporte-cdp-completo-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 5 sheets with correct names', async () => {
        const result = await builder.buildCdpExport();
        expect(result.sheets).toHaveLength(5);
        expect(result.sheets[0].name).toBe('Posiciones CDP');
        expect(result.sheets[1].name).toBe('CDPs');
        expect(result.sheets[2].name).toBe('Proyectos CDP');
        expect(result.sheets[3].name).toBe('Contratos Marco');
        expect(result.sheets[4].name).toBe('Actividades Detalladas');
    });

    it('should map positions data from service', async () => {
        const result = await builder.buildCdpExport();
        const row = result.sheets[0].data[0];
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.positionNumber).toBe(1);
        expect(row.rubricCode).toBe('R001');
    });

    it('should map CDPs data correctly', async () => {
        const result = await builder.buildCdpExport();
        const row = result.sheets[1].data[0];
        expect(row.number).toBe('CDP-001');
        expect(row.totalValue).toBe(80000);
    });

    it('should map CDP projects data', async () => {
        const result = await builder.buildCdpExport();
        const row = result.sheets[2].data[0];
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.projectCode).toBe('P001');
        expect(row.allocatedValue).toBe(50000);
    });

    it('should map contract relation data', async () => {
        const result = await builder.buildCdpExport();
        const row = result.sheets[3].data[0];
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.contractNumber).toBe('MC-001');
    });

    it('should map activities funding data', async () => {
        const result = await builder.buildCdpExport();
        const row = result.sheets[4].data[0];
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.activityCode).toBe('DA-001');
        expect(row.assignedValue).toBe(30000);
    });

    it('should call findForTable with correct args', async () => {
        await builder.buildCdpExport({ search: 'test' });
        expect(mockCdpPositionsService.findForTable).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'cdp.number', 'ASC');
    });

    it('should handle empty results', async () => {
        mockCdpPositionsService.findForTable.mockResolvedValue({ data: [] });
        mockCdpRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockFundingRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockCdpRelationRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockCdpProjectRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        const result = await builder.buildCdpExport();
        result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
    });

    it('should have correct column counts', async () => {
        const result = await builder.buildCdpExport();
        expect(result.sheets[0].columns).toHaveLength(10);
        expect(result.sheets[1].columns).toHaveLength(4);
        expect(result.sheets[2].columns).toHaveLength(4);
        expect(result.sheets[3].columns).toHaveLength(7);
        expect(result.sheets[4].columns).toHaveLength(8);
    });
});
