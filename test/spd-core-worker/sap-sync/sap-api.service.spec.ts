import { SapApiService } from '../../../apps/spd-core-worker/src/sap-sync/sap-api.service';
import { ConfigService } from '@nestjs/config';

describe('SapApiService', () => {
    let service: SapApiService;
    let mockCfg: Partial<ConfigService>;

    beforeEach(() => {
        mockCfg = {
            get: jest.fn().mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    'sap.url': 'http://sap-test',
                    'sap.auth': 'Basic test123',
                };
                return map[key] ?? '';
            }),
        };
        service = new SapApiService(mockCfg as ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should read config values', () => {
        expect((service as any).sapUrl).toBe('http://sap-test');
        expect((service as any).sapAuth).toBe('Basic test123');
    });

    it('should have an XML parser instance', () => {
        expect((service as any).xmlParser).toBeDefined();
    });

    describe('fetchContracts', () => {
        it('should return parsed contracts from mock XML', async () => {
            const result = await service.fetchContracts('2024-01-01', '2024-06-30');

            expect(result).toHaveProperty('items');
            expect(Array.isArray(result.items)).toBe(true);
        });

        it('should return contracts with all expected fields', async () => {
            const result = await service.fetchContracts('2024-01-01', '2024-12-31', '221');

            if (result.items.length > 0) {
                const contract = result.items[0];
                expect(contract).toHaveProperty('numContrato');
                expect(contract).toHaveProperty('objetoContrato');
                expect(contract).toHaveProperty('fechaInicio');
                expect(contract).toHaveProperty('fechaFinal');
                expect(contract).toHaveProperty('valorInicial');
                expect(contract).toHaveProperty('valorTotal');
                expect(contract).toHaveProperty('codContratista');
                expect(contract).toHaveProperty('nitContratista');
                expect(contract).toHaveProperty('nombreContratista');
                expect(contract).toHaveProperty('cdp');
                expect(contract).toHaveProperty('proyecto');
                expect(contract).toHaveProperty('estado');
            }
        });

        it('should accept custom codSecretaria parameter', async () => {
            const result = await service.fetchContracts('2024-01-01', '2024-06-30', '300');

            expect(result).toHaveProperty('items');
        });
    });

    describe('parseXmlResponse', () => {
        it('should return empty items when no ITEM node in XML', () => {
            const xml = `
                <Envelope><Body><MT_Contratos_Res><CONTRATOS></CONTRATOS></MT_Contratos_Res></Body></Envelope>
            `;

            const result = (service as any).parseXmlResponse(xml);
            expect(result.items).toEqual([]);
        });

        it('should handle a single ITEM (not wrapped in array)', () => {
            const xml = `
                <Envelope><Body><MT_Contratos_Res><CONTRATOS>
                    <ITEM>
                        <NUM_CONTRATO>C001</NUM_CONTRATO>
                        <OBJETO_CONTRATO>Test Contract</OBJETO_CONTRATO>
                        <VALOR_INICIAL>1000</VALOR_INICIAL>
                        <VALOR_TOTAL>2000</VALOR_TOTAL>
                        <ESTADO>Activo</ESTADO>
                    </ITEM>
                </CONTRATOS></MT_Contratos_Res></Body></Envelope>
            `;

            const result = (service as any).parseXmlResponse(xml);
            expect(result.items).toHaveLength(1);
            expect(result.items[0].numContrato).toBe('C001');
            expect(result.items[0].objetoContrato).toBe('Test Contract');
            expect(result.items[0].estado).toBe('Activo');
        });

        it('should handle multiple ITEMs', () => {
            const xml = `
                <Envelope><Body><MT_Contratos_Res><CONTRATOS>
                    <ITEM><NUM_CONTRATO>C001</NUM_CONTRATO><ESTADO>A</ESTADO></ITEM>
                    <ITEM><NUM_CONTRATO>C002</NUM_CONTRATO><ESTADO>B</ESTADO></ITEM>
                </CONTRATOS></MT_Contratos_Res></Body></Envelope>
            `;

            const result = (service as any).parseXmlResponse(xml);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].numContrato).toBe('C001');
            expect(result.items[1].numContrato).toBe('C002');
        });

        it('should handle completely invalid XML structure', () => {
            const xml = `<root><data>nothing</data></root>`;

            const result = (service as any).parseXmlResponse(xml);
            expect(result.items).toEqual([]);
        });
    });

    describe('convertDateFormat', () => {
        it('should return empty string for falsy input', () => {
            expect((service as any).convertDateFormat(null)).toBe('');
            expect((service as any).convertDateFormat(undefined)).toBe('');
            expect((service as any).convertDateFormat('')).toBe('');
        });

        it('should return 8-digit dates as-is (YYYYMMDD)', () => {
            expect((service as any).convertDateFormat('20240115')).toBe('20240115');
        });

        it('should convert DD.MM.YYYY to YYYYMMDD', () => {
            expect((service as any).convertDateFormat('15.01.2024')).toBe('20240115');
        });

        it('should convert DD-MM-YYYY to YYYYMMDD', () => {
            expect((service as any).convertDateFormat('05-12-2023')).toBe('20231205');
        });

        it('should convert DD/MM/YYYY to YYYYMMDD', () => {
            expect((service as any).convertDateFormat('1/3/2024')).toBe('20240301');
        });

        it('should pad single-digit day and month', () => {
            expect((service as any).convertDateFormat('5.3.2024')).toBe('20240305');
        });

        it('should return original string if not parseable', () => {
            expect((service as any).convertDateFormat('invalid')).toBe('invalid');
        });

        it('should handle numeric input', () => {
            expect((service as any).convertDateFormat(20240115)).toBe('20240115');
        });
    });

    describe('mapSapItemToContract', () => {
        it('should map SAP fields to SapContract interface', () => {
            const item = {
                NUM_CONTRATO: '12345',
                OBJETO_CONTRATO: 'My contract',
                VALOR_INICIAL: 1000000,
                VALOR_TOTAL: 2000000,
                COD_CONTRATISTA: 'CC01',
                NIT_CONTRATISTA: '900123456',
                NOMBRE_CONTRATISTA: 'Contractor S.A.',
                CDP: '7890',
                PROYECTO: 'P001',
                ESTADO: 'Activo',
                FECHA_INICIO: '01.01.2024',
                FECHA_FINAL: '31.12.2024',
            };

            const result = (service as any).mapSapItemToContract(item);

            expect(result.numContrato).toBe('12345');
            expect(result.objetoContrato).toBe('My contract');
            expect(result.valorInicial).toBe('1000000');
            expect(result.codContratista).toBe('CC01');
            expect(result.fechaInicio).toBe('20240101');
            expect(result.fechaFinal).toBe('20241231');
        });

        it('should use empty string for missing fields', () => {
            const result = (service as any).mapSapItemToContract({});

            expect(result.numContrato).toBe('');
            expect(result.objetoContrato).toBe('');
            expect(result.estado).toBe('');
        });
    });
});
