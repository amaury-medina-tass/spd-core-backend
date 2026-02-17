import { ContractsExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/contracts-export.builder';

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

describe('ContractsExportBuilder', () => {
    let builder: ContractsExportBuilder;
    let mockService: any;
    let mockCdpRelationRepo: any;
    let mockBudgetRecordRepo: any;
    let mockContractPositionRepo: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ number: 'MC-001', object: 'Obj', totalValue: '100000', startDate: '2024-01-01', endDate: '2024-12-31', state: 'Activo', contractor: { name: 'ACME', nit: '900123' }, need: { code: 'N001' } }],
            }),
        };
        mockCdpRelationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { masterContract: { number: 'MC-001' }, cdp: { number: 'CDP-001', totalValue: '80000', balance: '60000', dateIssue: '2024-03-15' } },
                ]),
            ),
        };
        mockBudgetRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { number: 'RP-001', totalValue: '90000', balance: '70000', contract: { number: 'MC-001' }, cdp: { number: 'CDP-001' } },
                ]),
            ),
        };
        mockContractPositionRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { positionNumber: 1, value: '50000', allocatedValue: '40000', availableBalance: '10000', description: 'Pos1', contract: { number: 'MC-001' }, budgetRecord: { number: 'RP-001' }, detailedActivity: { code: 'DA-001', name: 'Act 1' }, rubric: { code: 'R001' }, fundingSource: { name: 'FS1' }, project: { code: 'P001' } },
                ]),
            ),
        };

        builder = new ContractsExportBuilder(
            mockService,
            mockCdpRelationRepo as any,
            mockBudgetRecordRepo as any,
            mockContractPositionRepo as any,
        );
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildContractsExport();
        expect(result.fileName).toMatch(/^contratos-marco-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 4 sheets with correct names', async () => {
        const result = await builder.buildContractsExport();
        expect(result.sheets).toHaveLength(4);
        expect(result.sheets[0].name).toBe('Contratos Marco');
        expect(result.sheets[1].name).toBe('CDPs Vinculados');
        expect(result.sheets[2].name).toBe('Registros Presupuestales');
        expect(result.sheets[3].name).toBe('Posiciones de Contrato');
    });

    it('should map contracts data correctly', async () => {
        const result = await builder.buildContractsExport();
        const row = result.sheets[0].data[0];
        expect(row.number).toBe('MC-001');
        expect(row.totalValue).toBe(100000);
        expect(row.contractorName).toBe('ACME');
        expect(row.needCode).toBe('N001');
    });

    it('should map CDP data correctly', async () => {
        const result = await builder.buildContractsExport();
        const row = result.sheets[1].data[0];
        expect(row.contractNumber).toBe('MC-001');
        expect(row.cdpNumber).toBe('CDP-001');
        expect(row.cdpTotalValue).toBe(80000);
    });

    it('should map budget records data correctly', async () => {
        const result = await builder.buildContractsExport();
        const row = result.sheets[2].data[0];
        expect(row.contractNumber).toBe('MC-001');
        expect(row.rpNumber).toBe('RP-001');
        expect(row.rpTotalValue).toBe(90000);
    });

    it('should map positions data correctly', async () => {
        const result = await builder.buildContractsExport();
        const row = result.sheets[3].data[0];
        expect(row.contractNumber).toBe('MC-001');
        expect(row.positionNumber).toBe(1);
        expect(row.activityCode).toBe('DA-001');
        expect(row.rubricCode).toBe('R001');
        expect(row.fundingSourceName).toBe('FS1');
    });

    it('should pass search filter', async () => {
        await builder.buildContractsExport({ search: 'test' });
        expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'number', 'ASC');
    });

    it('should handle empty results', async () => {
        mockService.findAllPaginated.mockResolvedValue({ data: [] });
        mockCdpRelationRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockBudgetRecordRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockContractPositionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        const result = await builder.buildContractsExport();
        result.sheets.forEach((s: any) => expect(s.data).toEqual([]));
    });

    it('should handle null nested properties', async () => {
        mockService.findAllPaginated.mockResolvedValue({
            data: [{ number: null, object: null, totalValue: null, startDate: null, endDate: null, state: null, contractor: null, need: null }],
        });
        const result = await builder.buildContractsExport();
        const row = result.sheets[0].data[0];
        expect(row.number).toBe('');
        expect(row.totalValue).toBe(0);
        expect(row.contractorName).toBe('');
    });

    it('should have correct column counts', async () => {
        const result = await builder.buildContractsExport();
        expect(result.sheets[0].columns).toHaveLength(9);
        expect(result.sheets[1].columns).toHaveLength(5);
        expect(result.sheets[2].columns).toHaveLength(5);
        expect(result.sheets[3].columns).toHaveLength(12);
    });
});
