import { NeedsExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/needs-export.builder';

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

describe('NeedsExportBuilder', () => {
    let builder: NeedsExportBuilder;
    let mockService: any;
    let mockContractRepo: any;
    let mockCdpRelationRepo: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ code: 'N001', description: 'Necesidad 1', amount: '50000', previousStudy: { code: 'EP-001', status: 'Aprobado' } }],
            }),
        };
        mockContractRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { number: 'MC-001', object: 'Obj 1', totalValue: '100000', startDate: '2024-01-01', endDate: '2024-12-31', state: 'Activo', need: { code: 'N001' }, contractor: { name: 'ACME', nit: '900123' } },
                ]),
            ),
        };
        mockCdpRelationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { masterContract: { number: 'MC-001', need: { code: 'N001' } }, cdp: { number: 'CDP-001', totalValue: '80000', balance: '60000', dateIssue: '2024-03-15' } },
                ]),
            ),
        };

        builder = new NeedsExportBuilder(mockService, mockContractRepo as any, mockCdpRelationRepo as any);
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildNeedsExport();
        expect(result.fileName).toMatch(/^necesidades-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 3 sheets with correct names', async () => {
        const result = await builder.buildNeedsExport();
        expect(result.sheets).toHaveLength(3);
        expect(result.sheets[0].name).toBe('Necesidades');
        expect(result.sheets[1].name).toBe('Contratos Marco');
        expect(result.sheets[2].name).toBe('CDPs Vinculados');
    });

    it('should map needs data correctly', async () => {
        const result = await builder.buildNeedsExport();
        const row = result.sheets[0].data[0];
        expect(row.code).toBe('N001');
        expect(row.amount).toBe(50000);
        expect(row.previousStudyCode).toBe('EP-001');
    });

    it('should map contracts data correctly', async () => {
        const result = await builder.buildNeedsExport();
        const row = result.sheets[1].data[0];
        expect(row.needCode).toBe('N001');
        expect(row.number).toBe('MC-001');
        expect(row.totalValue).toBe(100000);
        expect(row.contractorName).toBe('ACME');
        expect(row.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should map CDP relation data correctly', async () => {
        const result = await builder.buildNeedsExport();
        const row = result.sheets[2].data[0];
        expect(row.needCode).toBe('N001');
        expect(row.contractNumber).toBe('MC-001');
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.cdpTotalValue).toBe(80000);
    });

    it('should pass search filter', async () => {
        await builder.buildNeedsExport({ search: 'test' });
        expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
    });

    it('should handle empty results', async () => {
        mockService.findAllPaginated.mockResolvedValue({ data: [] });
        mockContractRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockCdpRelationRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        const result = await builder.buildNeedsExport();
        result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
    });

    it('should handle null nested properties', async () => {
        mockService.findAllPaginated.mockResolvedValue({
            data: [{ code: null, description: null, amount: null, previousStudy: null }],
        });
        mockContractRepo.createQueryBuilder.mockReturnValue(
            createMockQueryBuilder([{ number: null, object: null, totalValue: null, startDate: null, endDate: null, state: null, need: null, contractor: null }]),
        );
        mockCdpRelationRepo.createQueryBuilder.mockReturnValue(
            createMockQueryBuilder([{ masterContract: null, cdp: null }]),
        );
        const result = await builder.buildNeedsExport();
        expect(result.sheets[0].data[0].code).toBe('');
        expect(result.sheets[0].data[0].amount).toBe(0);
        expect(result.sheets[1].data[0].contractorName).toBe('');
        expect(result.sheets[2].data[0].needCode).toBe('');
    });

    it('should have correct column counts', async () => {
        const result = await builder.buildNeedsExport();
        expect(result.sheets[0].columns).toHaveLength(5);
        expect(result.sheets[1].columns).toHaveLength(9);
        expect(result.sheets[2].columns).toHaveLength(6);
    });
});
