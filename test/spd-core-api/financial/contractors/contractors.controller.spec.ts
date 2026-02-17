import { ContractorsController } from '../../../../apps/spd-core-api/src/financial/contractors/controllers/contractors.controller';

describe('ContractorsController', () => {
    let controller: ContractorsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            findAll: jest.fn().mockResolvedValue([]),
        };
        controller = new ContractorsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll should delegate to service', () => {
        controller.findAll('ACME');
        expect(mockService.findAll).toHaveBeenCalledWith('ACME');
    });
});
