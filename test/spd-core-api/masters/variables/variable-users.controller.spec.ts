import { VariableUsersController } from '../../../../apps/spd-core-api/src/masters/variables/controllers/variable-users.controller';

describe('VariableUsersController', () => {
    let controller: VariableUsersController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findByVariableId: jest.fn().mockResolvedValue([]),
            assign: jest.fn().mockResolvedValue({ id: '1' }),
            unassign: jest.fn().mockResolvedValue(undefined),
        };
        controller = new VariableUsersController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findUsers should delegate to service', () => {
        controller.findUsers('var-1');
        expect(mockService.findByVariableId).toHaveBeenCalledWith('var-1');
    });

    it('assignUser should delegate to service', () => {
        controller.assignUser('var-1', { userId: 'u1', userName: 'John' } as any);
        expect(mockService.assign).toHaveBeenCalledWith('var-1', 'u1', 'John');
    });

    it('unassignUser should delegate to service', () => {
        controller.unassignUser('var-1', 'u1');
        expect(mockService.unassign).toHaveBeenCalledWith('var-1', 'u1');
    });
});
