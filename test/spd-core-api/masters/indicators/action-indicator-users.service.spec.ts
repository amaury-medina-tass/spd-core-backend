import { ConflictException, NotFoundException } from '@nestjs/common';
import { ActionIndicatorUsersService } from '../../../../apps/spd-core-api/src/masters/indicators/services/action-plan/action-indicator-users.service';

describe('ActionIndicatorUsersService', () => {
    let service: ActionIndicatorUsersService;
    let mockRepo: any;
    let mockIndicatorRepo: any;
    let mockAuditLog: any;

    const mockIndicator = { id: 'ind-1', code: 'AI001', name: 'Indicator 1' };

    beforeEach(() => {
        mockRepo = {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'aiu-1' })),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new ActionIndicatorUsersService(mockRepo, mockIndicatorRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByIndicatorId', () => {
        it('should return users for an indicator', async () => {
            mockRepo.find.mockResolvedValue([{ id: 'aiu-1', indicatorId: 'ind-1', userId: 'user-1' }]);

            const result = await service.findByIndicatorId('ind-1');

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(result).toHaveLength(1);
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findByIndicatorId('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('assign', () => {
        it('should assign a user to an indicator', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            const result = await service.assign('ind-1', 'user-1', 'John');

            expect(mockRepo.create).toHaveBeenCalledWith({ indicatorId: 'ind-1', userId: 'user-1' });
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.assign('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if already assigned', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'aiu-1' });

            await expect(service.assign('ind-1', 'user-1')).rejects.toThrow(ConflictException);
        });
    });

    describe('unassign', () => {
        it('should unassign a user from an indicator', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'aiu-1', indicatorId: 'ind-1', userId: 'user-1' });

            await service.unassign('ind-1', 'user-1', 'John');

            expect(mockRepo.remove).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if assignment does not exist', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.unassign('ind-1', 'user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findIndicatorsByUserId', () => {
        it('should return indicator ids for a user', async () => {
            mockRepo.find.mockResolvedValue([
                { indicatorId: 'ind-1' },
                { indicatorId: 'ind-2' },
            ]);

            const result = await service.findIndicatorsByUserId('user-1');

            expect(result).toEqual(['ind-1', 'ind-2']);
        });
    });
});
