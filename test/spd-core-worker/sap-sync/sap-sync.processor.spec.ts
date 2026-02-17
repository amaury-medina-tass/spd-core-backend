import { SapSyncProcessor } from '../../../apps/spd-core-worker/src/sap-sync/sap-sync.processor';

describe('SapSyncProcessor', () => {
    let processor: SapSyncProcessor;
    let mockOutboxRepo: any;
    let mockSapApi: any;
    let mockSapSyncService: any;

    beforeEach(() => {
        mockOutboxRepo = {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
        };
        mockSapApi = {
            fetchContracts: jest.fn().mockResolvedValue({ items: [] }),
        };
        mockSapSyncService = {
            processSapItems: jest.fn().mockResolvedValue(undefined),
        };
        processor = new SapSyncProcessor(mockOutboxRepo, mockSapApi, mockSapSyncService);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    describe('processSyncJobs', () => {
        it('should do nothing when no pending jobs', async () => {
            mockOutboxRepo.find.mockResolvedValue([]);

            await processor.processSyncJobs();

            expect(mockOutboxRepo.find).toHaveBeenCalled();
            expect(mockSapApi.fetchContracts).not.toHaveBeenCalled();
        });

        it('should process a pending job', async () => {
            const job = {
                id: 'job-1',
                payload: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
                attempts: 0,
            };
            mockOutboxRepo.find.mockResolvedValue([job]);
            mockSapApi.fetchContracts.mockResolvedValue({ items: [{ id: 1 }] });

            await processor.processSyncJobs();

            expect(mockSapApi.fetchContracts).toHaveBeenCalledWith('2024-01-01', '2024-06-30', '221');
            expect(mockSapSyncService.processSapItems).toHaveBeenCalledWith([{ id: 1 }]);
            expect(mockOutboxRepo.save).toHaveBeenCalled();
        });

        it('should skip job with max attempts reached', async () => {
            const job = {
                id: 'job-1',
                payload: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
                attempts: 5,
            };
            mockOutboxRepo.find.mockResolvedValue([job]);

            await processor.processSyncJobs();

            expect(mockSapApi.fetchContracts).not.toHaveBeenCalled();
        });

        it('should mark job as processed when no items returned', async () => {
            const job = {
                id: 'job-1',
                payload: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
                attempts: 0,
            };
            mockOutboxRepo.find.mockResolvedValue([job]);
            mockSapApi.fetchContracts.mockResolvedValue({ items: [] });

            await processor.processSyncJobs();

            expect(mockOutboxRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ processed_at: expect.any(Date) }),
            );
        });

        it('should increment attempts on error', async () => {
            const job = {
                id: 'job-1',
                payload: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
                attempts: 0,
            };
            mockOutboxRepo.find.mockResolvedValue([job]);
            mockSapApi.fetchContracts.mockRejectedValue(new Error('SAP API error'));

            await processor.processSyncJobs();

            expect(mockOutboxRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ attempts: 1, last_error: 'SAP API error' }),
            );
        });

        it('should prevent concurrent processing', async () => {
            const job = {
                id: 'job-1',
                payload: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
                attempts: 0,
            };

            // Simulate slow processing
            mockOutboxRepo.find.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([job]), 50)));
            mockSapApi.fetchContracts.mockResolvedValue({ items: [] });

            // Start two concurrent calls
            const p1 = processor.processSyncJobs();
            const p2 = processor.processSyncJobs();

            await Promise.all([p1, p2]);

            // Only one should have called find (second call returns early)
            expect(mockOutboxRepo.find).toHaveBeenCalledTimes(1);
        });
    });
});
