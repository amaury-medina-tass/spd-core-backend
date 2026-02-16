jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
        disconnect: jest.fn(),
    }));
});

import { RedisService } from '../../../libs/common/src/redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
    let service: RedisService;
    let mockConfigService: Partial<ConfigService>;

    beforeEach(() => {
        mockConfigService = {
            get: jest.fn().mockImplementation((key: string) => {
                const map: Record<string, any> = {
                    REDIS_HOST: 'localhost',
                    REDIS_PORT: 6379,
                };
                return map[key];
            }),
        };
        service = new RedisService(mockConfigService as ConfigService);
        service.onModuleInit();
    });

    describe('onModuleInit', () => {
        it('should create Redis client', () => {
            expect((service as any).client).toBeDefined();
        });

        it('should use default host/port when config values are missing', () => {
            const emptyCfg = {
                get: jest.fn().mockReturnValue(undefined),
            } as unknown as ConfigService;
            const svc = new RedisService(emptyCfg);
            svc.onModuleInit();
            expect((svc as any).client).toBeDefined();
        });
    });

    describe('set', () => {
        it('should set value without TTL', async () => {
            await service.set('key1', 'value1');
            expect((service as any).client.set).toHaveBeenCalledWith('key1', 'value1');
        });

        it('should set value with TTL', async () => {
            await service.set('key1', 'value1', 3600);
            expect((service as any).client.set).toHaveBeenCalledWith('key1', 'value1', 'EX', 3600);
        });
    });

    describe('get', () => {
        it('should return value when exists', async () => {
            (service as any).client.get.mockResolvedValue('value1');
            const result = await service.get('key1');
            expect(result).toBe('value1');
        });

        it('should return null when not exists', async () => {
            (service as any).client.get.mockResolvedValue(null);
            const result = await service.get('key1');
            expect(result).toBeNull();
        });
    });

    describe('del', () => {
        it('should delete key', async () => {
            await service.del('key1');
            expect((service as any).client.del).toHaveBeenCalledWith('key1');
        });
    });

    describe('onModuleDestroy', () => {
        it('should disconnect client', () => {
            service.onModuleDestroy();
            expect((service as any).client.disconnect).toHaveBeenCalled();
        });
    });
});
