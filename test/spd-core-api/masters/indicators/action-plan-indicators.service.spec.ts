import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActionPlanIndicatorsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/action-plan/action-plan-indicators.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('ActionPlanIndicatorsService', () => {
    let service: ActionPlanIndicatorsService;
    let mockIndicatorRepo: any;
    let mockUnitMeasureRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockIndicator = { id: 'ind-1', code: 'AI001', name: 'Indicator 1' };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockIndicator], 1);
        mockIndicatorRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'ind-1' })),
            findOne: jest.fn().mockResolvedValue(mockIndicator),
            preload: jest.fn().mockResolvedValue(mockIndicator),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockUnitMeasureRepo = {
            findOne: jest.fn().mockResolvedValue({ id: 'um-1', name: 'Unidad' }),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new ActionPlanIndicatorsService(mockIndicatorRepo, mockUnitMeasureRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an indicator', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null); // no existing with same code

            const dto = { code: 'AI001', name: 'Test' } as any;
            const result = await service.create(dto);

            expect(mockIndicatorRepo.create).toHaveBeenCalledWith(dto);
            expect(mockIndicatorRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException if code already exists', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue({ id: 'existing-id', code: 'AI001' });

            await expect(service.create({ code: 'AI001', name: 'Test' } as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException on DB duplicate error', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);
            mockIndicatorRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate' });

            await expect(service.create({ code: 'X', name: 'Y' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated();

            expect(mockQb.leftJoin).toHaveBeenCalled();
            expect(mockQb.orderBy).toHaveBeenCalledWith('i.code', 'DESC');
            expect(result.data).toHaveLength(1);
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated(1, 10, 'test');

            expect(mockQb.where).toHaveBeenCalled();
        });

        it('should handle dotted sortBy for relations', async () => {
            await service.findAllPaginated(1, 10, undefined, 'unitMeasure.name', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('unitMeasure.name', 'ASC');
        });
    });

    describe('findOne', () => {
        it('should return indicator with relations', async () => {
            const result = await service.findOne('ind-1');

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'ind-1' },
                relations: ['unitMeasure'],
            });
            expect(result).toEqual(mockIndicator);
        });

        it('should throw NotFoundException if not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update and audit log', async () => {
            const dto = { name: 'Updated' } as any;
            mockIndicatorRepo.findOne
                .mockResolvedValueOnce(mockIndicator) // findOne within update
                .mockResolvedValueOnce(null); // code check
            mockIndicatorRepo.save.mockResolvedValue({ ...mockIndicator, name: 'Updated' });

            const result = await service.update('ind-1', dto);

            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException if code exists for another indicator', async () => {
            mockIndicatorRepo.findOne
                .mockResolvedValueOnce(mockIndicator) // findOne within update
                .mockResolvedValueOnce({ id: 'other-id', code: 'DUPE' }); // code exists on different id

            await expect(service.update('ind-1', { code: 'DUPE' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove and audit log', async () => {
            await service.remove('ind-1');

            expect(mockIndicatorRepo.remove).toHaveBeenCalledWith(mockIndicator);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });
    });
});
