import { OutboxMessage } from '../../../libs/common/src/entities/outbox-message.entity';

describe('OutboxMessage Entity', () => {
    it('should create an entity with required fields', () => {
        const msg = new OutboxMessage();
        msg.id = 'test-id';
        msg.name = 'test.event';
        msg.payload = { key: 'value' };
        msg.headers = {};
        msg.attempts = 0;
        msg.occurred_at = new Date();

        expect(msg.id).toBe('test-id');
        expect(msg.name).toBe('test.event');
        expect(msg.payload).toEqual({ key: 'value' });
        expect(msg.attempts).toBe(0);
    });

    it('should have nullable fields', () => {
        const msg = new OutboxMessage();
        msg.id = 'test-id';
        msg.name = 'test.event';
        msg.payload = {};
        msg.headers = {};
        msg.attempts = 0;
        msg.occurred_at = new Date();

        expect(msg.last_error).toBeUndefined();
        expect(msg.processed_at).toBeUndefined();
    });

    it('should allow setting error and processed_at', () => {
        const msg = new OutboxMessage();
        msg.id = 'test-id';
        msg.name = 'test.event';
        msg.payload = {};
        msg.headers = {};
        msg.attempts = 3;
        msg.last_error = 'Connection timeout';
        msg.processed_at = new Date('2025-01-01');
        msg.occurred_at = new Date('2025-01-01');

        expect(msg.last_error).toBe('Connection timeout');
        expect(msg.processed_at).toEqual(new Date('2025-01-01'));
        expect(msg.attempts).toBe(3);
    });
});
