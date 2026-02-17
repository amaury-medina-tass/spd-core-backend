import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IndicativePlanIndicatorsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/indicative-plan/indicative-plan-indicators.service';

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

describe('IndicativePlanIndicatorsService', () => {
    let service: IndicativePlanIndicatorsService;
    let mockIndicatorRepo: any;
    let mockIndicatorTypeRepo: any;
    let mockUnitMeasureRepo: any;
    let mockDirectionRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockIndicator], 1);
        mockIndicatorRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'ind-1', code: entity.code ?? 'IND001', name: entity.name ?? 'Indicator 1' })),
            findOne: jest.fn().mockResolvedValue(mockIndicator),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorTypeRepo = {
            find: jest.fn().mockResolvedValue([{ id: 'it-1', name: 'Type1' }]),
        };
        mockUnitMeasureRepo = {
            find: jest.fn().mockResolvedValue([{ id: 'um-1', name: 'Unit1' }]),
        };
        mockDirectionRepo = {
            find: jest.fn().mockResolvedValue([{ id: 'dir-1', name: 'Dir1' }]),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new IndicativePlanIndicatorsService(
            mockIndicatorRepo,
            mockIndicatorTypeRepo,
            mockUnitMeasureRepo,
            mockDirectionRepo,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an indicator', async () => {
            mockIndicatorRepo.findOne.mockResolvedValueOnce(null); // no existing code

            const dto = { code: 'IND002', name: 'New Indicator' } as any;
            const result = await service.create(dto);

            expect(mockIndicatorRepo.create).toHaveBeenCalledWith(dto);
            expect(mockIndicatorRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException if code already exists', async () => {
            mockIndicatorRepo.findOne.mockResolvedValueOnce({ id: 'ind-2', code: 'IND001' });

            await expect(service.create({ code: 'IND001', name: 'Dup' } as any))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException on duplicate key error', async () => {
            mockIndicatorRepo.findOne.mockResolvedValueOnce(null);
            mockIndicatorRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate' });

            await expect(service.create({ code: 'IND003', name: 'New' } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated();

            expect(mockIndicatorRepo.createQueryBuilder).toHaveBeenCalledWith('i');
            expect(mockQb.orderBy).toHaveBeenCalledWith('i.code', 'DESC');
            expect(result.data).toHaveLength(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated(1, 10, 'test');

            expect(mockQb.where).toHaveBeenCalled();
        });

        it('should handle dotted sortBy', async () => {
            await service.findAllPaginated(1, 10, undefined, 'indicatorType.name', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('indicatorType.name', 'ASC');
        });

        it('should default invalid sortBy to code', async () => {
            await service.findAllPaginated(1, 10, undefined, 'invalidField');

            expect(mockQb.orderBy).toHaveBeenCalledWith('i.code', 'DESC');
        });

        it('should calculate pagination meta', async () => {
            mockQb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 25]);

            const result = await service.findAllPaginated(2, 10);

            expect(result.meta.totalPages).toBe(3);
            expect(result.meta.hasNextPage).toBe(true);
            expect(result.meta.hasPreviousPage).toBe(true);
        });
    });

    describe('findOne', () => {
        it('should return an indicator with relations', async () => {
            const result = await service.findOne('ind-1');

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'ind-1' },
                relations: ['indicatorType', 'unitMeasure', 'direction'],
            });
            expect(result).toEqual(mockIndicator);
        });

        it('should throw NotFoundException if not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update an indicator', async () => {
            // findOne for initial load
            mockIndicatorRepo.findOne
                .mockResolvedValueOnce(mockIndicator) // findOne in update
                .mockResolvedValueOnce(null); // check code uniqueness
            mockIndicatorRepo.save.mockResolvedValue({ ...mockIndicator, name: 'Updated' });

            const result = await service.update('ind-1', { name: 'Updated', code: 'IND002' } as any);

            expect(mockIndicatorRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });

        it('should throw NotFoundException if not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.update('bad-id', { name: 'X' } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if code already used by another', async () => {
            mockIndicatorRepo.findOne
                .mockResolvedValueOnce(mockIndicator) // findOne
                .mockResolvedValueOnce({ id: 'ind-other', code: 'IND002' }); // code check

            await expect(service.update('ind-1', { code: 'IND002' } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove an indicator and audit log', async () => {
            await service.remove('ind-1');

            expect(mockIndicatorRepo.remove).toHaveBeenCalledWith(mockIndicator);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getCatalogs', () => {
        it('should return indicator types, unit measures, and directions', async () => {
            const result = await service.getCatalogs();

            expect(mockIndicatorTypeRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
            expect(mockUnitMeasureRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
            expect(mockDirectionRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
            expect(result).toHaveProperty('indicatorTypes');
            expect(result).toHaveProperty('unitMeasures');
            expect(result).toHaveProperty('indicatorDirections');
        });
    });
});
