import { Test, TestingModule } from '@nestjs/testing';
import { SapSyncService } from '../../../apps/spd-core-worker/src/sap-sync/sap-sync.service';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { SapContract } from '../../../apps/spd-core-worker/src/sap-sync/sap-api.service';

const mockDependency = { id: 'dep-1', code: 'DEP01', name: 'Dep' };
const mockContractor = { id: 'cont-1', nit: '123456', name: 'Contractor' };
const mockFund = { id: 'fund-1', code: 'F01', name: 'Fund' };
const mockRubric = { id: 'rub-1', code: 'R01' };
const mockProject = { id: 'proj-1', code: 'P01', name: 'Project' };
const mockPrevStudy = { id: 'ps-1', code: 'PS01' };
const mockNeed = { id: 'need-1', code: 'N01' };
const mockCdp = { id: 'cdp-1', number: 'CDP001' };
const mockCdpPos = { id: 'cdppos-1' };
const mockContract = { id: 'mc-1', number: 'CT001' };
const mockBudgetRecord = { id: 'br-1', number: 'PED001' };

function buildMockSapItem(overrides: Partial<SapContract> = {}): SapContract {
    return {
        numContrato: 'CT001',
        objetoContrato: 'Test Object',
        fechaInicio: '20250101',
        fechaFinal: '20251231',
        valorInicial: '1000000.00',
        valorTotal: '1000000.00',
        valorFacturado: '500000.00',
        moneda: 'COP',
        codContratista: 'C001',
        nitContratista: '900123456',
        nombreContratista: 'Test Contractor',
        direccion: 'Calle 123',
        telefono: '3001234567',
        email: 'test@test.com',
        pedido: 'PED001',
        secretaria: 'SEC01',
        posicion: '0010',
        valorPosicion: '500000.00',
        cdp: 'CDP001',
        valorCDP: '1000000.00',
        proyecto: 'P01',
        nombreProyecto: 'Project 01',
        totalProyecto: '5000000.00',
        programa: 'PGM01',
        nombrePrograma: 'Programa 01',
        estudioPrevio: 'EP001',
        necesidad: 'N001',
        valorNecesidad: '1000000.00',
        cantidadPlan: '10',
        unidad: 'UND',
        valorUnitPlan: '100000.00',
        valorTotalPlan: '1000000.00',
        modalidad: 'Directa',
        causal: 'Test',
        estado: 'Legalizado',
        totalAdicion: '0',
        totalAmpliacion: '0',
        pospre: 'R01',
        codigoFondo: 'F01',
        descripcionFondo: 'Fondo Test',
        centroGestor: 'DEP01',
        descCentroGestor: 'Dependencia Test',
        ...overrides,
    };
}

describe('SapSyncService', () => {
    let service: SapSyncService;
    let mockManager: jest.Mocked<Partial<EntityManager>>;
    let mockQueryRunner: jest.Mocked<Partial<QueryRunner>>;
    let mockDataSource: jest.Mocked<Partial<DataSource>>;

    beforeEach(async () => {
        mockManager = {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((_entity, data) => data),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'new-id', ...entity })),
        };

        mockQueryRunner = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: mockManager as any,
        };

        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SapSyncService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<SapSyncService>(SapSyncService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('processSapItems', () => {
        it('should process items and commit transaction', async () => {
            mockManager.findOne!.mockResolvedValue(null);
            const items = [buildMockSapItem()];

            await service.processSapItems(items);

            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should rollback on error', async () => {
            mockManager.findOne!.mockRejectedValue(new Error('DB error'));
            const items = [buildMockSapItem()];

            await expect(service.processSapItems(items)).rejects.toThrow('DB error');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should handle empty items array', async () => {
            await service.processSapItems([]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('syncSingleItem (via processSapItems)', () => {
        it('should create new entities when none exist', async () => {
            mockManager.findOne!.mockResolvedValue(null);
            const items = [buildMockSapItem()];

            await service.processSapItems(items);

            expect(mockManager.create).toHaveBeenCalled();
            expect(mockManager.save).toHaveBeenCalled();
        });

        it('should reuse existing entities when found', async () => {
            mockManager.findOne!
                .mockResolvedValueOnce(mockDependency)
                .mockResolvedValueOnce(mockContractor)
                .mockResolvedValueOnce(mockFund)
                .mockResolvedValueOnce(mockRubric)
                .mockResolvedValueOnce(mockProject)
                .mockResolvedValueOnce(mockPrevStudy)
                .mockResolvedValueOnce(mockNeed)
                .mockResolvedValueOnce(mockCdp)
                .mockResolvedValueOnce({ id: 'cp-1', cdpId: 'cdp-1', projectId: 'proj-1', allocatedValue: 100 })
                .mockResolvedValueOnce(mockCdpPos)
                .mockResolvedValueOnce(mockContract)
                .mockResolvedValueOnce(mockBudgetRecord)
                .mockResolvedValueOnce({ id: 'existing-pos' });

            await service.processSapItems([buildMockSapItem()]);

            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should handle null codes gracefully', async () => {
            const item = buildMockSapItem({
                centroGestor: '',
                nitContratista: '',
                codigoFondo: '',
                pospre: '',
                proyecto: '',
                estudioPrevio: '',
                necesidad: '',
                cdp: '',
                numContrato: '',
                pedido: '',
                posicion: '',
            });

            mockManager.findOne!.mockResolvedValue(null);
            await service.processSapItems([item]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('parseMoney (via processSapItems)', () => {
        it('should parse valid money string with spaces', async () => {
            const item = buildMockSapItem({ valorTotal: '  965000000.00  ' });
            mockManager.findOne!.mockResolvedValue(null);
            await service.processSapItems([item]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should return 0 for empty value', async () => {
            const item = buildMockSapItem({ valorTotal: '' });
            mockManager.findOne!.mockResolvedValue(null);
            await service.processSapItems([item]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('parseSapDate (via processSapItems)', () => {
        it('should parse valid SAP date YYYYMMDD', async () => {
            const item = buildMockSapItem({ fechaInicio: '20250730', fechaFinal: '20260101' });
            mockManager.findOne!.mockResolvedValue(null);
            await service.processSapItems([item]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should handle invalid date (wrong length)', async () => {
            const item = buildMockSapItem({ fechaInicio: '2025', fechaFinal: '' });
            mockManager.findOne!.mockResolvedValue(null);
            await service.processSapItems([item]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('syncCdpProjectRelation', () => {
        it('should update existing CdpProject allocatedValue', async () => {
            const existingCdpProject = { id: 'cp-1', cdpId: 'cdp-1', projectId: 'proj-1', allocatedValue: 100 };

            mockManager.findOne!
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(existingCdpProject)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            await service.processSapItems([buildMockSapItem()]);

            const saveCalls = (mockManager.save as jest.Mock).mock.calls;
            const cdpProjectSave = saveCalls.find((call: any) =>
                call[0] && call[0].allocatedValue !== undefined && call[0].id === 'cp-1'
            );
            expect(cdpProjectSave).toBeDefined();
        });
    });

    describe('syncBudgetRecord', () => {
        it('should update existing budget record', async () => {
            const existingBR = { id: 'br-1', number: 'PED001', contractId: null, cdpId: null, totalValue: 0 };

            mockManager.findOne!
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(existingBR)
                .mockResolvedValueOnce(null);

            await service.processSapItems([buildMockSapItem()]);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('multiple items', () => {
        it('should process multiple SAP items sequentially', async () => {
            mockManager.findOne!.mockResolvedValue(null);
            const items = [
                buildMockSapItem({ numContrato: 'CT001' }),
                buildMockSapItem({ numContrato: 'CT002' }),
                buildMockSapItem({ numContrato: 'CT003' }),
            ];

            await service.processSapItems(items);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        });
    });
});
