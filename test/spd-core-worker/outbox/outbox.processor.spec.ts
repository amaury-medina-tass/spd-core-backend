import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OutboxProcessor } from '../../../apps/spd-core-worker/src/outbox/outbox.processor';
import { OutboxPublisher } from '../../../apps/spd-core-worker/src/outbox/outbox.publisher';
import { OutboxMessage } from '@common/entities/outbox-message.entity';

function createMockQueryBuilder(results: any[] = []) {
    const qb: any = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getMany = jest.fn().mockResolvedValue(results);
    return qb;
}

describe('OutboxProcessor', () => {
    let processor: OutboxProcessor;
    let mockRepo: any;
    let mockPublisher: any;

    beforeEach(async () => {
        mockRepo = {
            createQueryBuilder: jest.fn(),
            save: jest.fn().mockImplementation((msg) => Promise.resolve(msg)),
        };
        mockPublisher = {
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OutboxProcessor,
                { provide: getRepositoryToken(OutboxMessage), useValue: mockRepo },
                { provide: OutboxPublisher, useValue: mockPublisher },
            ],
        }).compile();

        processor = module.get(OutboxProcessor);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    it('tick() should do nothing when no pending messages', async () => {
        mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
        await processor.tick();
        expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it('tick() should publish pending messages and mark processed', async () => {
        const msg = {
            id: '1',
            name: 'test.event',
            payload: { data: 'x' },
            attempts: 0,
            processed_at: null as any,
            updated_at: null as any,
        };
        mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([msg]));

        await processor.tick();

        expect(mockPublisher.publish).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1', name: 'test.event' }),
        );
        expect(msg.processed_at).toBeInstanceOf(Date);
        expect(mockRepo.save).toHaveBeenCalledWith(msg);
    });

    it('tick() should skip messages at max attempts', async () => {
        const msg = {
            id: '2',
            name: 'fail.event',
            payload: {},
            attempts: 10,
            processed_at: null,
            updated_at: null,
        };
        mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([msg]));

        await processor.tick();

        expect(mockPublisher.publish).not.toHaveBeenCalled();
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('tick() should increment attempts on publish failure', async () => {
        const msg = {
            id: '3',
            name: 'fail.event',
            payload: {},
            attempts: 0,
            processed_at: null as any,
            updated_at: null as any,
            last_error: null as any,
        };
        mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([msg]));
        mockPublisher.publish.mockRejectedValueOnce(new Error('bus error'));

        await processor.tick();

        expect(msg.attempts).toBe(1);
        expect(msg.last_error).toBe('bus error');
        expect(mockRepo.save).toHaveBeenCalledWith(msg);
    });

    it('tick() should handle null attempts gracefully', async () => {
        const msg = {
            id: '4',
            name: 'test.event',
            payload: {},
            attempts: null as any,
            processed_at: null as any,
            updated_at: null as any,
        };
        mockRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([msg]));

        await processor.tick();

        expect(mockPublisher.publish).toHaveBeenCalled();
        expect(msg.processed_at).toBeInstanceOf(Date);
    });
});
