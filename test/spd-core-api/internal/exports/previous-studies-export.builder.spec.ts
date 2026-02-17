import { PreviousStudiesExportBuilder } from '../../../../apps/spd-core-api/src/internal/exports/previous-studies-export.builder';

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

describe('PreviousStudiesExportBuilder', () => {
    let builder: PreviousStudiesExportBuilder;
    let mockService: any;
    let mockNeedRepo: any;
    let mockContractRepo: any;

    beforeEach(() => {
        mockService = {
            findAllPaginated: jest.fn().mockResolvedValue({
                data: [{ code: 'EP-001', status: 'Aprobado' }],
            }),
        };
        mockNeedRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { code: 'N001', description: 'Necesidad 1', amount: '50000', previousStudy: { code: 'EP-001', status: 'Aprobado' } },
                ]),
            ),
        };
        mockContractRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(
                createMockQueryBuilder([
                    { number: 'MC-001', object: 'Contrato 1', totalValue: '100000', state: 'Activo', need: { code: 'N001', previousStudy: { code: 'EP-001' } }, contractor: { name: 'ACME', nit: '900123456' } },
                ]),
            ),
        };

        builder = new PreviousStudiesExportBuilder(mockService, mockNeedRepo as any, mockContractRepo as any);
    });

    it('should be defined', () => {
        expect(builder).toBeDefined();
    });

    it('should return correct fileName pattern', async () => {
        const result = await builder.buildPreviousStudiesExport();
        expect(result.fileName).toMatch(/^estudios-previos-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should return 3 sheets with correct names', async () => {
        const result = await builder.buildPreviousStudiesExport();
        expect(result.sheets).toHaveLength(3);
        expect(result.sheets[0].name).toBe('Estudios Previos');
        expect(result.sheets[1].name).toBe('Necesidades Asociadas');
        expect(result.sheets[2].name).toBe('Contratos Marco');
    });

    it('should map previous studies data', async () => {
        const result = await builder.buildPreviousStudiesExport();
        expect(result.sheets[0].data[0]).toEqual({ code: 'EP-001', status: 'Aprobado' });
    });

    it('should map needs data with nested previous study', async () => {
        const result = await builder.buildPreviousStudiesExport();
        const row = result.sheets[1].data[0];
        expect(row.previousStudyCode).toBe('EP-001');
        expect(row.needCode).toBe('N001');
        expect(row.needAmount).toBe(50000);
    });

    it('should map contracts data with nested relations', async () => {
        const result = await builder.buildPreviousStudiesExport();
        const row = result.sheets[2].data[0];
        expect(row.contractNumber).toBe('MC-001');
        expect(row.contractorName).toBe('ACME');
        expect(row.previousStudyCode).toBe('EP-001');
    });

    it('should pass search filter', async () => {
        await builder.buildPreviousStudiesExport({ search: 'test' });
        expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, Number.MAX_SAFE_INTEGER, 'test', 'code', 'ASC');
    });

    it('should handle empty results', async () => {
        mockService.findAllPaginated.mockResolvedValue({ data: [] });
        mockNeedRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        mockContractRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        const result = await builder.buildPreviousStudiesExport();
        expect(result.sheets[0].data).toEqual([]);
        expect(result.sheets[1].data).toEqual([]);
        expect(result.sheets[2].data).toEqual([]);
    });

    it('should handle null nested properties', async () => {
        mockNeedRepo.createQueryBuilder.mockReturnValue(
            createMockQueryBuilder([{ code: null, description: null, amount: null, previousStudy: null }]),
        );
        mockContractRepo.createQueryBuilder.mockReturnValue(
            createMockQueryBuilder([{ number: null, object: null, totalValue: null, state: null, need: null, contractor: null }]),
        );
        const result = await builder.buildPreviousStudiesExport();
        expect(result.sheets[1].data[0].previousStudyCode).toBe('');
        expect(result.sheets[1].data[0].needAmount).toBe(0);
        expect(result.sheets[2].data[0].contractorName).toBe('');
    });

    it('should have correct column counts', async () => {
        const result = await builder.buildPreviousStudiesExport();
        expect(result.sheets[0].columns).toHaveLength(2);
        expect(result.sheets[1].columns).toHaveLength(5);
        expect(result.sheets[2].columns).toHaveLength(8);
    });
});
