import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VariableLocationsService } from '../../../../apps/spd-core-api/src/masters/variables/services/variable-locations.service';

describe('VariableLocationsService', () => {
    let service: VariableLocationsService;
    let mockVariableLocationRepo: any;
    let mockVariableRepo: any;
    let mockLocationRepo: any;
    let mockAuditLog: any;

    const mockVariable = { id: 'var-1', code: 'V001', name: 'Variable 1' };
    const mockLocation = { id: 'loc-1', address: 'Addr 1', communeId: 'com-1' };
    const mockRelation = { id: 'vl-1', variableId: 'var-1', locationId: 'loc-1', location: { ...mockLocation, commune: { id: 'com-1', name: 'C1' } } };

    beforeEach(() => {
        mockVariableLocationRepo = {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([mockRelation]),
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'vl-1' })),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockVariableRepo = {
            findOne: jest.fn().mockResolvedValue(mockVariable),
        };
        mockLocationRepo = {
            findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariableLocationsService(
            mockVariableLocationRepo,
            mockVariableRepo,
            mockLocationRepo,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('addLocation', () => {
        it('should add a location to a variable', async () => {
            const result = await service.addLocation('var-1', 'loc-1');

            expect(mockVariableRepo.findOne).toHaveBeenCalledWith({ where: { id: 'var-1' } });
            expect(mockLocationRepo.findOne).toHaveBeenCalledWith({ where: { id: 'loc-1' } });
            expect(mockVariableLocationRepo.create).toHaveBeenCalled();
            expect(mockVariableLocationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if variable not found', async () => {
            mockVariableRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocation('bad-var', 'loc-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if location not found', async () => {
            mockLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.addLocation('var-1', 'bad-loc')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if relation already exists', async () => {
            mockVariableLocationRepo.findOne.mockResolvedValue({ id: 'vl-1' });

            await expect(service.addLocation('var-1', 'loc-1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('removeLocation', () => {
        it('should remove a location from a variable', async () => {
            mockVariableLocationRepo.findOne.mockResolvedValue(mockRelation);

            await service.removeLocation('var-1', 'loc-1');

            expect(mockVariableLocationRepo.remove).toHaveBeenCalledWith(mockRelation);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockVariableLocationRepo.findOne.mockResolvedValue(null);

            await expect(service.removeLocation('var-1', 'loc-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByVariable', () => {
        it('should return locations for a variable', async () => {
            const result = await service.findByVariable('var-1');

            expect(mockVariableLocationRepo.find).toHaveBeenCalledWith({
                where: { variableId: 'var-1' },
                relations: ['location', 'location.commune'],
                order: { createAt: 'DESC' },
            });
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should map results correctly', async () => {
            const result = await service.findByVariable('var-1');

            expect(result[0]).toHaveProperty('locationId');
            expect(result[0]).toHaveProperty('location');
        });
    });
});
