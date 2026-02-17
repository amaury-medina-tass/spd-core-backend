import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IndicatorLocationsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/indicator-locations.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(resultData),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
        getRawMany: jest.fn().mockResolvedValue([]),
    };
    return qb;
}

describe('IndicatorLocationsService', () => {
    let service: IndicatorLocationsService;
    let mockIndicatorLocationRepo: any;
    let mockLocationRepo: any;
    let mockIndicativePlanIndicatorRepo: any;
    let mockActionPlanIndicatorRepo: any;
    let mockVariableLocationRepo: any;
    let mockCommuneRepo: any;
    let mockVariableActionRelationRepo: any;
    let mockVariableIndicativeRelationRepo: any;
    let mockAuditLog: any;

    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };
    const mockLocation = { id: 'loc-1', address: 'Address 1', communeId: 'com-1' };
    const mockRelation = { id: 'il-1', indicativeIndicatorId: 'ind-1', locationId: 'loc-1', location: { ...mockLocation, commune: { id: 'com-1', name: 'C1' } }, createAt: new Date() };

    beforeEach(() => {
        mockIndicatorLocationRepo = {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([mockRelation]),
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'il-1' })),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        };
        mockLocationRepo = {
            findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        mockIndicativePlanIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([mockIndicator], 1)),
        };
        mockActionPlanIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([mockIndicator], 1)),
        };
        mockVariableLocationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        };
        mockCommuneRepo = {
            findOne: jest.fn().mockResolvedValue({ id: 'com-1', code: '001', name: 'Commune 1' }),
        };
        mockVariableActionRelationRepo = {
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        };
        mockVariableIndicativeRelationRepo = {
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new IndicatorLocationsService(
            mockIndicatorLocationRepo,
            mockLocationRepo,
            mockIndicativePlanIndicatorRepo,
            mockActionPlanIndicatorRepo,
            mockVariableLocationRepo,
            mockCommuneRepo,
            mockVariableActionRelationRepo,
            mockVariableIndicativeRelationRepo,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('addLocationToIndicativeIndicator', () => {
        it('should add a location to an indicative indicator', async () => {
            const result = await service.addLocationToIndicativeIndicator('ind-1', 'loc-1');

            expect(mockIndicativePlanIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockLocationRepo.findOne).toHaveBeenCalledWith({ where: { id: 'loc-1' } });
            expect(mockIndicatorLocationRepo.create).toHaveBeenCalled();
            expect(mockIndicatorLocationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicativePlanIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocationToIndicativeIndicator('bad-id', 'loc-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if location not found', async () => {
            mockLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocationToIndicativeIndicator('ind-1', 'bad-loc'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if relation already exists', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue({ id: 'il-1' });

            await expect(service.addLocationToIndicativeIndicator('ind-1', 'loc-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('addLocationToActionIndicator', () => {
        it('should add a location to an action indicator', async () => {
            const result = await service.addLocationToActionIndicator('ind-1', 'loc-1');

            expect(mockActionPlanIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockLocationRepo.findOne).toHaveBeenCalledWith({ where: { id: 'loc-1' } });
            expect(mockIndicatorLocationRepo.create).toHaveBeenCalled();
            expect(mockIndicatorLocationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if action indicator not found', async () => {
            mockActionPlanIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocationToActionIndicator('bad-id', 'loc-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if location not found', async () => {
            mockLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocationToActionIndicator('ind-1', 'bad-loc'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if relation already exists', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue({ id: 'il-1' });

            await expect(service.addLocationToActionIndicator('ind-1', 'loc-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('removeLocationFromIndicativeIndicator', () => {
        it('should remove a location from an indicative indicator', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue(mockRelation);

            await service.removeLocationFromIndicativeIndicator('ind-1', 'loc-1');

            expect(mockIndicatorLocationRepo.remove).toHaveBeenCalledWith(mockRelation);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.removeLocationFromIndicativeIndicator('ind-1', 'loc-1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('removeLocationFromActionIndicator', () => {
        it('should remove a location from an action indicator', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue(mockRelation);

            await service.removeLocationFromActionIndicator('ind-1', 'loc-1');

            expect(mockIndicatorLocationRepo.remove).toHaveBeenCalledWith(mockRelation);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockIndicatorLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.removeLocationFromActionIndicator('ind-1', 'loc-1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findByIndicativeIndicator', () => {
        it('should return locations for an indicative indicator', async () => {
            const result = await service.findByIndicativeIndicator('ind-1');

            expect(mockIndicatorLocationRepo.find).toHaveBeenCalledWith({
                where: { indicativeIndicatorId: 'ind-1' },
                relations: ['location', 'location.commune'],
                order: { createAt: 'DESC' },
            });
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty('locationId');
        });
    });

    describe('findByActionIndicator', () => {
        it('should return locations for an action indicator', async () => {
            mockIndicatorLocationRepo.find.mockResolvedValue([{
                ...mockRelation,
                actionIndicatorId: 'ind-1',
            }]);

            const result = await service.findByActionIndicator('ind-1');

            expect(mockIndicatorLocationRepo.find).toHaveBeenCalledWith({
                where: { actionIndicatorId: 'ind-1' },
                relations: ['location', 'location.commune'],
                order: { createAt: 'DESC' },
            });
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('findActionIndicatorsByCommuneCode', () => {
        it('should return all indicators when communeCode is "all"', async () => {
            const mockQb = createMockQueryBuilder([mockIndicator], 1);
            mockActionPlanIndicatorRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findActionIndicatorsByCommuneCode('all');

            expect(result.data).toBeDefined();
            expect(result.data[0]).toHaveProperty('matchSource', 'all');
        });

        it('should throw NotFoundException if commune not found', async () => {
            mockCommuneRepo.findOne.mockResolvedValue(null);

            await expect(service.findActionIndicatorsByCommuneCode('999'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return empty if no matching indicators', async () => {
            const result = await service.findActionIndicatorsByCommuneCode('001');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should apply search filter when communeCode is "all"', async () => {
            const mockQb = createMockQueryBuilder([], 0);
            mockActionPlanIndicatorRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findActionIndicatorsByCommuneCode('all', 1, 10, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });
    });

    describe('findIndicativeIndicatorsByCommuneCode', () => {
        it('should return all indicators when communeCode is "all"', async () => {
            const mockQb = createMockQueryBuilder([mockIndicator], 1);
            mockIndicativePlanIndicatorRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findIndicativeIndicatorsByCommuneCode('all');

            expect(result.data).toBeDefined();
            expect(result.data[0]).toHaveProperty('matchSource', 'all');
        });

        it('should throw NotFoundException if commune not found', async () => {
            mockCommuneRepo.findOne.mockResolvedValue(null);

            await expect(service.findIndicativeIndicatorsByCommuneCode('999'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return empty if no matching indicators', async () => {
            const result = await service.findIndicativeIndicatorsByCommuneCode('001');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });
    });

    describe('findVariablesByActionIndicatorLocation', () => {
        it('should throw NotFoundException if indicator not found', async () => {
            mockActionPlanIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findVariablesByActionIndicatorLocation('bad-id'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return empty if indicator has no locations', async () => {
            mockIndicatorLocationRepo.find.mockResolvedValue([]);

            const result = await service.findVariablesByActionIndicatorLocation('ind-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return empty if indicator has no variable relations', async () => {
            mockIndicatorLocationRepo.find.mockResolvedValue([mockRelation]);
            mockVariableActionRelationRepo.find.mockResolvedValue([]);

            const result = await service.findVariablesByActionIndicatorLocation('ind-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });
    });

    describe('findVariablesByIndicativeIndicatorLocation', () => {
        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicativePlanIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findVariablesByIndicativeIndicatorLocation('bad-id'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return empty if indicator has no locations', async () => {
            mockIndicatorLocationRepo.find.mockResolvedValue([]);

            const result = await service.findVariablesByIndicativeIndicatorLocation('ind-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return empty if indicator has no variable relations', async () => {
            mockIndicatorLocationRepo.find.mockResolvedValue([mockRelation]);
            mockVariableIndicativeRelationRepo.find.mockResolvedValue([]);

            const result = await service.findVariablesByIndicativeIndicatorLocation('ind-1');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });
    });
});
