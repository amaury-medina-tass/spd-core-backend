import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../../../apps/spd-core-api/src/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let mockCfg: any;
    let mockRedis: any;

    beforeEach(() => {
        mockCfg = {
            get: jest.fn().mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    'jwt.accessPublicKey': '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWe\nCPIgxMFIJETFFCDIx5UiZlYn0MJR36GI/w2VN3JVcRwHXkHlSqaFe5bLzWiJCOlq\nYKqVLkBGMCE3JjZ8PNqJCwuGihSBUFE8lLfJqDO3g3xJrJIj9J5P1w8bLNlZIheg\nxJcMwpNEfD+GK3MvBdCKAjXk2JlvBDq3H7r3kB+JdXhF6FhDAcKrCNpFTzJWPYN1\nvzjOxZYfkpKbUfnE2BLTtCTx7k0c7c1GWkBRIGEBpoGUb0LJILwAiF6gHO3lLxbI\nuxuVN78d1SqsEGPHZXIkoU0AAAAAAAAAAAtMnHw8gG1FwVrWRBSC87w4wIDAQAB\n-----END PUBLIC KEY-----',
                    'systemName': 'SPD',
                };
                return map[key];
            }),
        };
        mockRedis = {
            get: jest.fn(),
        };

        strategy = new JwtStrategy(mockCfg, mockRedis);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('validate() returns user with permissions when valid', async () => {
        const permissions = { '/module': { actions: { read: { allowed: true } } } };
        mockRedis.get.mockResolvedValue(JSON.stringify(permissions));

        const payload = { sub: 'user-1', system: 'SPD', email: 'test@test.com' };
        const result = await strategy.validate(payload);

        expect(result.sub).toBe('user-1');
        expect(result.permissions).toEqual(permissions);
        expect(mockRedis.get).toHaveBeenCalledWith('user_permissions:user-1');
    });

    it('validate() throws UnauthorizedException for wrong system', async () => {
        const payload = { sub: 'user-1', system: 'OTHER' };

        await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('validate() throws UnauthorizedException when permissions not in Redis', async () => {
        mockRedis.get.mockResolvedValue(null);

        const payload = { sub: 'user-1', system: 'SPD' };

        await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('validate() succeeds when payload has no system field', async () => {
        const permissions = { '/mod': {} };
        mockRedis.get.mockResolvedValue(JSON.stringify(permissions));

        const payload = { sub: 'user-1' };
        const result = await strategy.validate(payload);

        expect(result.permissions).toEqual(permissions);
    });
});
