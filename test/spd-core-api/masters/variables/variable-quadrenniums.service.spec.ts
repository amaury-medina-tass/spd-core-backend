import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VariableQuadrenniumsService } from '../../../../apps/spd-core-api/src/masters/variables/services/variable-quadrenniums.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('VariableQuadrenniumsService', () => {
    let service: VariableQuadrenniumsService;
    let mockRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockQuadrennium = { id: 'q-1', variableId: 'var-1', startYear: 2024, endYear: 2027, value: 500 };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockQuadrennium], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'q-1', startYear: entity.startYear ?? 2024, endYear: entity.endYear ?? 2027 })),
            findOne: jest.fn().mockResolvedValue(mockQuadrennium),
            preload: jest.fn().mockResolvedValue(mockQuadrennium),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariableQuadrenniumsService(mockRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a quadrennium with valid 4-year range', async () => {
            const dto = { variableId: 'var-1', startYear: 2024, endYear: 2027, value: 500 } as any;

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith(dto);
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException for invalid year range', async () => {
            const dto = { variableId: 'var-1', startYear: 2024, endYear: 2026, value: 500 } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            const dto = { variableId: 'var-1', startYear: 2024, endYear: 2027, value: 500 } as any;
            mockRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated('var-1');

            expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
            expect(mockQb.where).toHaveBeenCalledWith('variable.id = :parentId', { parentId: 'var-1' });
            expect(mockQb.orderBy).toHaveBeenCalledWith('vq.createAt', 'DESC');
            expect(result.data).toHaveLength(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated('var-1', 1, 10, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should handle dotted sortBy', async () => {
            await service.findAllPaginated('var-1', 1, 10, undefined, 'variable.code', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('variable.code', 'ASC');
        });

        it('should default invalid sortBy', async () => {
            await service.findAllPaginated('var-1', 1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('vq.createAt', 'DESC');
        });

        it('should calculate pagination meta correctly', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated('var-1', 2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('update', () => {
        it('should update a quadrennium', async () => {
            const dto = { value: 600, startYear: 2024, endYear: 2027 } as any;
            mockRepo.preload.mockResolvedValue({ ...mockQuadrennium, value: 600 });
            mockRepo.save.mockResolvedValue({ ...mockQuadrennium, value: 600 });

            const result = await service.update('q-1', dto);

            expect(mockRepo.preload).toHaveBeenCalledWith({ id: 'q-1', ...dto });
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.value).toBe(600);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { value: 600 } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid year range on update', async () => {
            const dto = { startYear: 2024, endYear: 2025 } as any;
            mockRepo.preload.mockResolvedValue({ ...mockQuadrennium, startYear: 2024, endYear: 2025 });

            await expect(service.update('q-1', dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockRepo.preload.mockResolvedValue(mockQuadrennium);
            mockRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.update('q-1', { value: 600 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove a quadrennium and audit log', async () => {
            await service.remove('q-1');

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'q-1' } });
            expect(mockRepo.remove).toHaveBeenCalledWith(mockQuadrennium);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
        });
    });
});
