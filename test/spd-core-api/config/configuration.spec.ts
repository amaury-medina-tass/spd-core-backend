import configuration from '../../../apps/spd-core-api/src/config/configuration';

describe('configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return default values when env vars are not set', () => {
        delete process.env.NODE_ENV;
        const config = configuration();
        expect(config.env).toBe('development');
        expect(config.port).toBe(3003);
        expect(config.database.url).toBe('');
        expect(config.jwt.accessPublicKey).toBe('');
        expect(config.serviceBus.topic).toBe('spd.events');
        expect(config.sap.url).toBe('');
    });

    it('should use env vars when set', () => {
        process.env.NODE_ENV = 'production';
        process.env.PORT = '4000';
        process.env.DATABASE_URL = 'postgres://test';
        process.env.JWT_ACCESS_PUBLIC_KEY = 'pubkey123';
        process.env.SAP_URL = 'http://sap';
        process.env.SAP_AUTH = 'Basic xxx';

        const config = configuration();
        expect(config.env).toBe('production');
        expect(config.port).toBe(4000);
        expect(config.database.url).toBe('postgres://test');
        expect(config.jwt.accessPublicKey).toBe('pubkey123');
        expect(config.sap.url).toBe('http://sap');
        expect(config.sap.auth).toBe('Basic xxx');
    });

    it('should parse PORT as a number', () => {
        process.env.PORT = '8080';
        const config = configuration();
        expect(typeof config.port).toBe('number');
        expect(config.port).toBe(8080);
    });

    it('should include cosmosDb config', () => {
        const config = configuration();
        expect(config.cosmosDb).toBeDefined();
        expect(config.cosmosDb.databaseName).toBe('spd_audit');
        expect(config.cosmosDb.containerName).toBe('spd_core_logs');
    });

    it('should include serviceBus config', () => {
        process.env.SERVICEBUS_CONNECTION_STRING = 'Endpoint=sb://test';
        const config = configuration();
        expect(config.serviceBus.connectionString).toBe('Endpoint=sb://test');
        expect(config.serviceBus.subjectPrefix).toBe('SpdCore.');
    });
});
