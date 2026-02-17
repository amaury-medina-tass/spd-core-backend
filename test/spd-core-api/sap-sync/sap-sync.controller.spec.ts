import { SapSyncController } from '../../../apps/spd-core-api/src/sap-sync/sap-sync.controller';

describe('SapSyncController', () => {
    let controller: SapSyncController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            enqueueSync: jest.fn().mockResolvedValue({ id: 'job-uuid-1' }),
        };
        controller = new SapSyncController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('requestSync should enqueue sync and return structured response', async () => {
        const dto = { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' } as any;
        const result = await controller.requestSync(dto);

        expect(mockService.enqueueSync).toHaveBeenCalledWith(dto);
        expect(result).toEqual({
            success: true,
            message: 'Sincronización encolada',
            data: {
                jobId: 'job-uuid-1',
                fechaInicio: '2024-01-01',
                fechaFin: '2024-06-30',
            },
        });
    });
});
