jest.mock('@azure/service-bus', () => {
    const mockSender = {
        sendMessages: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
    };
    const mockClient = {
        createSender: jest.fn().mockReturnValue(mockSender),
        close: jest.fn().mockResolvedValue(undefined),
    };
    return {
        ServiceBusClient: jest.fn().mockImplementation(() => mockClient),
        __mockClient: mockClient,
        __mockSender: mockSender,
    };
});

import { ServiceBusClient } from '@azure/service-bus';
import { ServiceBusPublisher } from '../../../libs/common/src/messaging/servicebus.publisher';

const { __mockClient: mockClient, __mockSender: mockSender } = jest.requireMock('@azure/service-bus');

describe('ServiceBusPublisher', () => {
    let publisher: ServiceBusPublisher;

    beforeEach(() => {
        jest.clearAllMocks();
        publisher = new ServiceBusPublisher('Endpoint=sb://test.servicebus.windows.net/', 'test-topic');
    });

    it('should create a ServiceBusClient and sender', () => {
        expect(ServiceBusClient).toHaveBeenCalledWith('Endpoint=sb://test.servicebus.windows.net/');
        expect(mockClient.createSender).toHaveBeenCalledWith('test-topic');
    });

    describe('publish', () => {
        it('should send a message with correct structure', async () => {
            const message = {
                id: 'evt-1',
                name: 'TestEvent',
                payload: { data: 'test' },
                headers: { correlationId: 'corr-1' },
            };

            await publisher.publish(message);

            expect(mockSender.sendMessages).toHaveBeenCalledWith({
                body: { data: 'test' },
                subject: 'TestEvent',
                applicationProperties: {
                    eventId: 'evt-1',
                    eventName: 'TestEvent',
                    correlationId: 'corr-1',
                },
                contentType: 'application/json',
            });
        });

        it('should prepend subjectPrefix when provided', async () => {
            const message = {
                id: 'evt-2',
                name: 'Created',
                payload: {},
                headers: {},
            };

            await publisher.publish(message, 'Order.');

            expect(mockSender.sendMessages).toHaveBeenCalledWith(
                expect.objectContaining({ subject: 'Order.Created' }),
            );
        });

        it('should handle message without headers', async () => {
            const message = {
                id: 'evt-3',
                name: 'SimpleEvent',
                payload: { value: 42 },
            };

            await publisher.publish(message);

            expect(mockSender.sendMessages).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: { value: 42 },
                    subject: 'SimpleEvent',
                    applicationProperties: expect.objectContaining({
                        eventId: 'evt-3',
                        eventName: 'SimpleEvent',
                    }),
                }),
            );
        });

        it('should use empty string as prefix when subjectPrefix is undefined', async () => {
            const message = { id: 'e-1', name: 'Evt', payload: {}, headers: {} };

            await publisher.publish(message);

            expect(mockSender.sendMessages).toHaveBeenCalledWith(
                expect.objectContaining({ subject: 'Evt' }),
            );
        });
    });

    describe('close', () => {
        it('should close sender and client', async () => {
            await publisher.close();

            expect(mockSender.close).toHaveBeenCalled();
            expect(mockClient.close).toHaveBeenCalled();
        });
    });
});
