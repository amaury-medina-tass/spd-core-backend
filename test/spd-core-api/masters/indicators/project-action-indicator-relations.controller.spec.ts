import { ProjectActionIndicatorRelationsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/project-action-indicator-relations.controller';

describe('ProjectActionIndicatorRelationsController', () => {
    let controller: ProjectActionIndicatorRelationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            associate: jest.fn().mockResolvedValue({ message: 'associated' }),
            disassociate: jest.fn().mockResolvedValue({ message: 'disassociated' }),
            findPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new ProjectActionIndicatorRelationsController(mockService);
    });

    it('associate() delegates to service', () => {
        controller.associate('ind-1', 'proj-1');
        expect(mockService.associate).toHaveBeenCalledWith('ind-1', 'proj-1');
    });

    it('disassociate() delegates to service', () => {
        controller.disassociate('ind-1', 'proj-1');
        expect(mockService.disassociate).toHaveBeenCalledWith('ind-1', 'proj-1');
    });

    it('find() delegates with defaults', () => {
        controller.find('ind-1', undefined as any, undefined as any, '', 'all');
        expect(mockService.findPaginated).toHaveBeenCalledWith('ind-1', 'all', 1, 20, '');
    });

    it('find() delegates with custom params', () => {
        controller.find('ind-1', 2, 5, 'test', 'associated');
        expect(mockService.findPaginated).toHaveBeenCalledWith('ind-1', 'associated', 2, 5, 'test');
    });
});
