import { SapSyncService } from '../../../apps/spd-core-api/src/sap-sync/sap-sync.service';

describe('SapSyncService', () => {
    let service: SapSyncService;
    let mockOutboxService: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockOutboxService = {
            enqueue: jest.fn().mockResolvedValue({ id: 'job-uuid-1' }),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new SapSyncService(mockOutboxService, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('enqueueSync should enqueue an outbox message and log audit', async () => {
        const dto = { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' } as any;

        const result = await service.enqueueSync(dto);

        expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
            'sap.sync.requested',
            expect.objectContaining({
                fechaInicio: '2024-01-01',
                fechaFin: '2024-06-30',
                codSecretaria: '221',
            }),
            { source: 'api', type: 'sync-request' },
        );
        expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        expect(result).toEqual({ id: 'job-uuid-1' });
    });

    it('enqueueSync should default codSecretaria to 221', async () => {
        const dto = { fechaInicio: '2024-01-01', fechaFin: '2024-06-30' } as any;

        await service.enqueueSync(dto);

        expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
            'sap.sync.requested',
            expect.objectContaining({ codSecretaria: '221' }),
            expect.any(Object),
        );
    });
});
