import { ServiceBusSubscriber } from '../../../apps/spd-core-worker/src/messaging/servicebus.subscriber';

describe('ServiceBusSubscriber', () => {
    let subscriber: ServiceBusSubscriber;
    let mockConfig: any;
    let mockSapSyncService: any;

    beforeEach(() => {
        mockConfig = {
            get: jest.fn().mockReturnValue(''),
        };
        mockSapSyncService = {
            processSapItems: jest.fn().mockResolvedValue(undefined),
        };
        subscriber = new ServiceBusSubscriber(mockConfig, mockSapSyncService);
    });

    it('should be defined', () => {
        expect(subscriber).toBeDefined();
    });

    describe('onModuleInit', () => {
        it('should not create client when connection string is empty', async () => {
            mockConfig.get.mockReturnValue('');

            await subscriber.onModuleInit();

            // No client should be created - just a warning logged
            expect(mockConfig.get).toHaveBeenCalledWith('serviceBus.connectionString');
        });
    });

    describe('onModuleDestroy', () => {
        it('should handle destroy gracefully when no client', async () => {
            // Should not throw when no client was created
            await expect(subscriber.onModuleDestroy()).resolves.toBeUndefined();
        });
    });

    describe('handleMessage', () => {
        it('should process SAP sync messages', async () => {
            // Access private method for testing
            const handleMessage = (subscriber as any).handleMessage.bind(subscriber);

            const message = {
                applicationProperties: { eventName: 'sap.sync.requested' },
                subject: 'sap.sync.requested',
                body: { fechaInicio: '2024-01-01', fechaFin: '2024-06-30', codSecretaria: '221' },
            };

            await handleMessage(message);

            // The method should complete without error
        });

        it('should handle unknown events without throwing', async () => {
            const handleMessage = (subscriber as any).handleMessage.bind(subscriber);

            const message = {
                applicationProperties: { eventName: 'unknown.event' },
                subject: 'unknown',
                body: {},
            };

            // Should not throw - just logs a warning
            await handleMessage(message);
        });
    });

    describe('handleError', () => {
        it('should log errors without throwing', async () => {
            const handleError = (subscriber as any).handleError.bind(subscriber);

            const args = {
                error: new Error('Test error'),
            };

            await expect(handleError(args)).resolves.toBeUndefined();
        });
    });
});
