import { OutboxService } from '../../../apps/spd-core-api/src/outbox/outbox.service';

describe('OutboxService', () => {
    let service: OutboxService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            create: jest.fn().mockImplementation((data: any) => ({ ...data, id: 'msg-uuid-1' })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'msg-uuid-1' })),
        };
        service = new OutboxService(mockRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('enqueue should create and save an outbox message', async () => {
        const name = 'test.event';
        const payload = { key: 'value' };
        const headers = { source: 'test' };

        const result = await service.enqueue(name, payload, headers);

        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'test.event',
            payload: { key: 'value' },
            headers: { source: 'test' },
            attempts: 0,
        }));
        expect(mockRepo.save).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.id).toBe('msg-uuid-1');
    });

    it('enqueue should use empty headers by default', async () => {
        await service.enqueue('event', { data: 1 });

        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'event',
            payload: { data: 1 },
            headers: {},
        }));
    });
});
