import { AuditLogService, COSMOS_DATABASE, COSMOS_CONTAINER_NAME } from '../../../libs/common/src/cosmosdb/audit-log.service';
import { AuditAction, AuditEntityType } from '@common/types/audit.types';

describe('AuditLogService', () => {
    let service: AuditLogService;
    let mockDatabase: any;
    let mockContainer: any;

    beforeEach(() => {
        mockContainer = {
            items: { create: jest.fn().mockResolvedValue({}) },
        };
        mockDatabase = {
            containers: {
                createIfNotExists: jest.fn().mockResolvedValue({ container: mockContainer }),
            },
        };
    });

    describe('with CosmosDB configured', () => {
        beforeEach(async () => {
            service = new AuditLogService(mockDatabase, 'test_logs');
            await service.onModuleInit();
        });

        it('should initialize container on module init', () => {
            expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledWith({
                id: 'test_logs',
                partitionKey: { paths: ['/entityType'] },
            });
        });

        it('should log entry to CosmosDB', async () => {
            await service.log(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1', true, { entityName: 'test' });
            expect(mockContainer.items.create).toHaveBeenCalled();
            const logEntry = mockContainer.items.create.mock.calls[0][0];
            expect(logEntry.id).toBeDefined();
            expect(logEntry.success).toBe(true);
            expect(logEntry.entityId).toBe('ent-1');
        });

        it('should logSuccess correctly', async () => {
            await service.logSuccess(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1');
            expect(mockContainer.items.create).toHaveBeenCalled();
        });

        it('should logError correctly', async () => {
            await service.logError(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1', { message: 'fail', code: 'E001' });
            const logEntry = mockContainer.items.create.mock.calls[0][0];
            expect(logEntry.success).toBe(false);
            expect(logEntry.error).toEqual({ message: 'fail', code: 'E001' });
        });

        it('should handle CosmosDB create error gracefully', async () => {
            mockContainer.items.create.mockRejectedValue(new Error('DB error'));
            await expect(service.log(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1', true)).resolves.not.toThrow();
        });
    });

    describe('without CosmosDB (mock mode)', () => {
        beforeEach(async () => {
            service = new AuditLogService(null, null);
            await service.onModuleInit();
        });

        it('should initialize without error', () => {
            expect((service as any).initialized).toBe(true);
        });

        it('should log in mock mode without throwing', async () => {
            await expect(service.logSuccess(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1')).resolves.not.toThrow();
        });
    });

    describe('initialization failure', () => {
        it('should handle container initialization error', async () => {
            mockDatabase.containers.createIfNotExists.mockRejectedValue(new Error('Init failed'));
            service = new AuditLogService(mockDatabase, 'test_logs');
            await service.onModuleInit();
            expect((service as any).initialized).toBe(true);
            expect((service as any).container).toBeNull();
        });
    });

    describe('default container name', () => {
        it('should use default container name when none provided', () => {
            service = new AuditLogService(mockDatabase, null);
            expect((service as any).containerName).toBe('audit_logs');
        });
    });

    describe('before initialization', () => {
        it('should return early when not initialized', async () => {
            service = new AuditLogService(mockDatabase, 'test');
            await service.log(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, 'ent-1', true);
            expect(mockContainer.items.create).not.toHaveBeenCalled();
        });
    });
});
