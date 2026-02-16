import { VariableActionRelationsController } from '../../../../apps/spd-core-api/src/masters/indicators/controllers/action-plan/variable-action-relations.controller';

describe('VariableActionRelationsController', () => {
    let controller: VariableActionRelationsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            associate: jest.fn().mockResolvedValue({ message: 'associated' }),
            disassociate: jest.fn().mockResolvedValue({ message: 'disassociated' }),
            findPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new VariableActionRelationsController(mockService);
    });

    it('associate() delegates to service', () => {
        controller.associate('ind-1', 'var-1');
        expect(mockService.associate).toHaveBeenCalledWith('ind-1', 'var-1');
    });

    it('disassociate() delegates to service', () => {
        controller.disassociate('ind-1', 'var-1');
        expect(mockService.disassociate).toHaveBeenCalledWith('ind-1', 'var-1');
    });

    it('find() delegates with defaults', () => {
        controller.find('ind-1', undefined as any, undefined as any, '', 'all');
        expect(mockService.findPaginated).toHaveBeenCalledWith('ind-1', 'all', 1, 20, '');
    });

    it('find() delegates with custom params', () => {
        controller.find('ind-1', 2, 5, 'test', 'available');
        expect(mockService.findPaginated).toHaveBeenCalledWith('ind-1', 'available', 2, 5, 'test');
    });
});
