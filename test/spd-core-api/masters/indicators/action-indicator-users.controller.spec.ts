import { ActionIndicatorUsersController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/action-indicator-users.controller';

describe('ActionIndicatorUsersController', () => {
    let controller: ActionIndicatorUsersController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findByIndicatorId: jest.fn().mockResolvedValue([]),
            assign: jest.fn().mockResolvedValue({ id: '1' }),
            unassign: jest.fn().mockResolvedValue(undefined),
        };
        controller = new ActionIndicatorUsersController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findUsers should delegate to service', () => {
        controller.findUsers('ind-1');
        expect(mockService.findByIndicatorId).toHaveBeenCalledWith('ind-1');
    });

    it('assignUser should delegate to service', () => {
        controller.assignUser('ind-1', { userId: 'u1', userName: 'John' } as any);
        expect(mockService.assign).toHaveBeenCalledWith('ind-1', 'u1', 'John');
    });

    it('unassignUser should delegate to service', () => {
        controller.unassignUser('ind-1', 'u1');
        expect(mockService.unassign).toHaveBeenCalledWith('ind-1', 'u1');
    });
});
