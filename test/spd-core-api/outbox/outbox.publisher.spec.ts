const mockPublishFn = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../libs/common/src/messaging/servicebus.publisher', () => ({
    ServiceBusPublisher: jest.fn().mockImplementation(() => ({
        publish: mockPublishFn,
    })),
}));

import { OutboxPublisher } from '../../../apps/spd-core-worker/src/outbox/outbox.publisher';
import { ConfigService } from '@nestjs/config';

describe('OutboxPublisher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function createMockCfg(connectionString: string): ConfigService {
        return {
            get: jest.fn().mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    'serviceBus.connectionString': connectionString,
                    'serviceBus.topic': 'spd.events',
                    'serviceBus.subjectPrefix': 'SpdCore.',
                };
                return map[key] ?? '';
            }),
        } as unknown as ConfigService;
    }

    it('should create publisher without connection string (mock mode)', () => {
        const publisher = new OutboxPublisher(createMockCfg(''));
        expect(publisher).toBeDefined();
        expect((publisher as any).publisher).toBeNull();
    });

    it('should create ServiceBusPublisher when connection string is provided', () => {
        const publisher = new OutboxPublisher(createMockCfg('Endpoint=sb://test.servicebus.windows.net/'));
        expect(publisher).toBeDefined();
        expect((publisher as any).publisher).not.toBeNull();
    });

    it('should publish in mock mode (log only)', async () => {
        const publisher = new OutboxPublisher(createMockCfg(''));
        const envelope = { id: '1', name: 'test.event', payload: { data: 'test' }, headers: {} };

        await expect(publisher.publish(envelope as any)).resolves.not.toThrow();
        expect(mockPublishFn).not.toHaveBeenCalled();
    });

    it('should publish via ServiceBusPublisher in production mode', async () => {
        const publisher = new OutboxPublisher(createMockCfg('Endpoint=sb://test.servicebus.windows.net/'));
        const envelope = { id: '2', name: 'order.created', payload: { orderId: 42 }, headers: {} };

        await publisher.publish(envelope as any);
        expect(mockPublishFn).toHaveBeenCalledWith(envelope, 'SpdCore.');
    });

    it('should use default values when config returns null', () => {
        const nullCfg = {
            get: jest.fn().mockReturnValue(null),
        } as unknown as ConfigService;

        const publisher = new OutboxPublisher(nullCfg);
        expect((publisher as any).publisher).toBeNull();
        expect((publisher as any).subjectPrefix).toBe('SpdCore.');
    });
});
