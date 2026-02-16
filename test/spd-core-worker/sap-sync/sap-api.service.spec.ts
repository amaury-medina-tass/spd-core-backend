import { SapApiService } from '../../../apps/spd-core-worker/src/sap-sync/sap-api.service';
import { ConfigService } from '@nestjs/config';

describe('SapApiService', () => {
    let service: SapApiService;
    let mockCfg: Partial<ConfigService>;

    beforeEach(() => {
        mockCfg = {
            get: jest.fn().mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    'sap.url': 'http://sap-test',
                    'sap.auth': 'Basic test123',
                };
                return map[key] ?? '';
            }),
        };
        service = new SapApiService(mockCfg as ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should read config values', () => {
        expect((service as any).sapUrl).toBe('http://sap-test');
        expect((service as any).sapAuth).toBe('Basic test123');
    });

    it('should have an XML parser instance', () => {
        expect((service as any).xmlParser).toBeDefined();
    });
});
