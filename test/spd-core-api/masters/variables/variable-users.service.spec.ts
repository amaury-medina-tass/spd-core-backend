import { ConflictException, NotFoundException } from '@nestjs/common';
import { VariableUsersService } from '../../../../apps/spd-core-api/src/masters/variables/services/variable-users.service';

describe('VariableUsersService', () => {
    let service: VariableUsersService;
    let mockRepo: any;
    let mockVariableRepo: any;
    let mockAuditLog: any;

    const mockVariable = { id: 'var-1', code: 'V001', name: 'Variable 1' };

    beforeEach(() => {
        mockRepo = {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'vu-1' })),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockVariableRepo = {
            findOne: jest.fn().mockResolvedValue(mockVariable),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariableUsersService(mockRepo, mockVariableRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByVariableId', () => {
        it('should return users for a variable', async () => {
            mockRepo.find.mockResolvedValue([{ id: 'vu-1', variableId: 'var-1', userId: 'user-1' }]);

            const result = await service.findByVariableId('var-1');

            expect(mockVariableRepo.findOne).toHaveBeenCalledWith({ where: { id: 'var-1' } });
            expect(result).toHaveLength(1);
        });

        it('should throw NotFoundException if variable not found', async () => {
            mockVariableRepo.findOne.mockResolvedValue(null);

            await expect(service.findByVariableId('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('assign', () => {
        it('should assign a user to a variable', async () => {
            mockRepo.findOne.mockResolvedValue(null); // no existing assignment

            const result = await service.assign('var-1', 'user-1', 'John Doe');

            expect(mockRepo.create).toHaveBeenCalledWith({ variableId: 'var-1', userId: 'user-1' });
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if variable not found', async () => {
            mockVariableRepo.findOne.mockResolvedValue(null);

            await expect(service.assign('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if already assigned', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'vu-1' });

            await expect(service.assign('var-1', 'user-1')).rejects.toThrow(ConflictException);
        });

        it('should use default userName when not provided', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await service.assign('var-1', 'abcdefgh-1234');

            expect(mockAuditLog.logSuccess).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                'var-1',
                expect.objectContaining({
                    entityName: expect.stringContaining('Usuario abcdefgh'),
                }),
            );
        });
    });

    describe('unassign', () => {
        it('should unassign a user from a variable', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'vu-1', variableId: 'var-1', userId: 'user-1' });

            await service.unassign('var-1', 'user-1', 'John Doe');

            expect(mockRepo.remove).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if assignment does not exist', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.unassign('var-1', 'user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findVariablesByUserId', () => {
        it('should return variable ids for a user', async () => {
            mockRepo.find.mockResolvedValue([
                { variableId: 'var-1' },
                { variableId: 'var-2' },
            ]);

            const result = await service.findVariablesByUserId('user-1');

            expect(result).toEqual(['var-1', 'var-2']);
        });
    });
});
