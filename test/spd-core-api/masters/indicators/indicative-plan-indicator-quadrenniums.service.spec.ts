import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IndicativePlanIndicatorQuadrenniumsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/indicative-plan/indicative-plan-indicator-quadrenniums.service';

describe('IndicativePlanIndicatorQuadrenniumsService', () => {
    let service: IndicativePlanIndicatorQuadrenniumsService;
    let mockQuadRepo: any;
    let mockIndicatorRepo: any;
    let mockAuditLog: any;

    const mockQuad = { id: 'q-1', indicatorId: 'ind-1', startYear: 2024, endYear: 2027, value: 500 };
    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };

    beforeEach(() => {
        mockQuadRepo = {
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'q-1', startYear: entity.startYear ?? 2024, endYear: entity.endYear ?? 2027 })),
            findOne: jest.fn().mockResolvedValue(mockQuad),
            find: jest.fn().mockResolvedValue([mockQuad]),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new IndicativePlanIndicatorQuadrenniumsService(mockQuadRepo, mockIndicatorRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a quadrennium when indicator exists', async () => {
            const dto = { indicatorId: 'ind-1', startYear: 2024, endYear: 2027, value: 500 } as any;

            const result = await service.create(dto);

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockQuadRepo.create).toHaveBeenCalledWith(dto);
            expect(mockQuadRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.create({ indicatorId: 'bad-id' } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockQuadRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.create({ indicatorId: 'ind-1', startYear: 2024, endYear: 2027 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllByIndicator', () => {
        it('should return quadrenniums ordered by startYear', async () => {
            const result = await service.findAllByIndicator('ind-1');

            expect(mockQuadRepo.find).toHaveBeenCalledWith({
                where: { indicatorId: 'ind-1' },
                order: { startYear: 'ASC' },
            });
            expect(result).toEqual([mockQuad]);
        });
    });

    describe('findOne', () => {
        it('should return a quadrennium by id', async () => {
            const result = await service.findOne('q-1');

            expect(mockQuadRepo.findOne).toHaveBeenCalledWith({ where: { id: 'q-1' } });
            expect(result).toEqual(mockQuad);
        });

        it('should throw NotFoundException if not found', async () => {
            mockQuadRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a quadrennium', async () => {
            const dto = { value: 600 } as any;
            mockQuadRepo.save.mockResolvedValue({ ...mockQuad, value: 600 });

            const result = await service.update('q-1', dto);

            expect(mockQuadRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.value).toBe(600);
        });

        it('should throw NotFoundException if not found', async () => {
            mockQuadRepo.findOne.mockResolvedValue(null);

            await expect(service.update('bad-id', { value: 600 } as any))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate key', async () => {
            mockQuadRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.update('q-1', { value: 600 } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove a quadrennium and audit log', async () => {
            await service.remove('q-1');

            expect(mockQuadRepo.remove).toHaveBeenCalledWith(mockQuad);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            mockQuadRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
        });
    });
});
