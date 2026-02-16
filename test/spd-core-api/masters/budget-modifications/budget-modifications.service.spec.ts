import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModificationsService } from '../../../../apps/spd-core-api/src/masters/budget-modifications/services/budget-modifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BudgetModification, ModificationType } from '../../../../apps/spd-core-api/src/masters/budget-modifications/entities/budget-modification.entity';
import { DataSource } from 'typeorm';
import { AuditLogService } from '@common/cosmosdb/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BudgetModificationsService', () => {
    let service: BudgetModificationsService;
    let mockRepo: any;
    let mockQueryRunner: any;
    let mockAuditLog: any;

    beforeEach(async () => {
        mockRepo = {
            create: jest.fn().mockImplementation(data => data),
            findOne: jest.fn().mockResolvedValue(null),
            createQueryBuilder: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            }),
        };

        mockQueryRunner = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: {
                findOne: jest.fn(),
                save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mod-1', ...entity })),
            },
        };

        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BudgetModificationsService,
                { provide: getRepositoryToken(BudgetModification), useValue: mockRepo },
                { provide: DataSource, useValue: { createQueryRunner: () => mockQueryRunner } },
                { provide: AuditLogService, useValue: mockAuditLog },
            ],
        }).compile();

        service = module.get<BudgetModificationsService>(BudgetModificationsService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('create', () => {
        const detailedActivity = {
            id: 'da-1', code: 'DA01', name: 'Activity',
            budgetCeiling: 1000, balance: 500, rubricId: 'rub-1',
        };

        it('should create an ADDITION modification', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.ADDITION, value: 200 } as any;

            await service.create(dto);

            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should create a REDUCTION modification', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.REDUCTION, value: 100 } as any;

            await service.create(dto);

            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw for REDUCTION exceeding balance', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.REDUCTION, value: 9999 } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should create a TRANSFER modification', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.TRANSFER, newRubricId: 'rub-2' } as any;

            await service.create(dto);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw for TRANSFER with same rubric', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.TRANSFER, newRubricId: 'rub-1' } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw for TRANSFER without newRubricId', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.TRANSFER } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when detailed activity not found', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue(null);
            const dto = { detailedActivityId: 'missing', modificationType: ModificationType.ADDITION, value: 100 } as any;

            await expect(service.create(dto)).rejects.toThrow(NotFoundException);
        });

        it('should throw for ADDITION without value', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: ModificationType.ADDITION, value: 0 } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw for unsupported modification type', async () => {
            mockQueryRunner.manager.findOne.mockResolvedValue({ ...detailedActivity });
            const dto = { detailedActivityId: 'da-1', modificationType: 'UNKNOWN' } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated results', async () => {
            const result = await service.findAllPaginated(1, 10);
            expect(result).toEqual({
                data: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            });
        });

        it('should handle search parameter', async () => {
            const qb = mockRepo.createQueryBuilder();
            await service.findAllPaginated(1, 10, 'test');
            expect(qb.where).toHaveBeenCalled();
        });

        it('should handle relation sort field', async () => {
            const qb = mockRepo.createQueryBuilder();
            await service.findAllPaginated(1, 10, undefined, 'detailedActivity.code', 'ASC');
            expect(qb.orderBy).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return modification when found', async () => {
            const mod = { id: 'mod-1', modificationType: 'ADDITION' };
            mockRepo.findOne.mockResolvedValue(mod);
            const result = await service.findOne('mod-1');
            expect(result).toEqual(mod);
        });

        it('should throw NotFoundException when not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('handleDBExceptions', () => {
        it('should throw BadRequestException for duplicate entry', () => {
            expect(() => (service as any).handleDBExceptions({ code: '23505', detail: 'Duplicate' }))
                .toThrow(BadRequestException);
        });

        it('should log non-duplicate errors', () => {
            expect(() => (service as any).handleDBExceptions({ code: '12345' })).not.toThrow();
        });
    });
});
