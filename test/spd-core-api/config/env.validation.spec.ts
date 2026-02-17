import { envValidationSchema } from '../../../apps/spd-core-api/src/config/env.validation';

describe('envValidationSchema', () => {
    const validEnv = {
        SYSTEM_NAME: 'SPD',
        DATABASE_URL: 'postgresql://localhost:5432/spd',
        JWT_ACCESS_PUBLIC_KEY: 'some-public-key',
    };

    it('should validate with required fields and defaults', () => {
        const { error, value } = envValidationSchema.validate(validEnv);
        expect(error).toBeUndefined();
        expect(value.NODE_ENV).toBe('development');
        expect(value.PORT).toBe(3003);
        expect(value.SERVICEBUS_TOPIC).toBe('spd.events');
        expect(value.SERVICEBUS_SUBJECT_PREFIX).toBe('SpdCore.');
    });

    it('should fail when SYSTEM_NAME is missing', () => {
        const { error } = envValidationSchema.validate({ DATABASE_URL: 'url', JWT_ACCESS_PUBLIC_KEY: 'key' });
        expect(error).toBeDefined();
        expect(error!.message).toContain('SYSTEM_NAME');
    });

    it('should fail when DATABASE_URL is missing', () => {
        const { error } = envValidationSchema.validate({ SYSTEM_NAME: 'SPD', JWT_ACCESS_PUBLIC_KEY: 'key' });
        expect(error).toBeDefined();
        expect(error!.message).toContain('DATABASE_URL');
    });

    it('should fail when JWT_ACCESS_PUBLIC_KEY is missing', () => {
        const { error } = envValidationSchema.validate({ SYSTEM_NAME: 'SPD', DATABASE_URL: 'url' });
        expect(error).toBeDefined();
        expect(error!.message).toContain('JWT_ACCESS_PUBLIC_KEY');
    });

    it('should accept custom PORT as number', () => {
        const { error, value } = envValidationSchema.validate({ ...validEnv, PORT: 4000 });
        expect(error).toBeUndefined();
        expect(value.PORT).toBe(4000);
    });

    it('should allow empty SERVICEBUS_CONNECTION_STRING', () => {
        const { error } = envValidationSchema.validate({ ...validEnv, SERVICEBUS_CONNECTION_STRING: '' });
        expect(error).toBeUndefined();
    });

    it('should accept custom NODE_ENV', () => {
        const { error, value } = envValidationSchema.validate({ ...validEnv, NODE_ENV: 'production' });
        expect(error).toBeUndefined();
        expect(value.NODE_ENV).toBe('production');
    });
});
