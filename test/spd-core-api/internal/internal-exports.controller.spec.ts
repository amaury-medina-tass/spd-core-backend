import { InternalExportsController } from '../../../apps/spd-core-api/src/internal/internal-exports.controller';

describe('InternalExportsController', () => {
    let controller: InternalExportsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            getExportData: jest.fn().mockResolvedValue({ fileName: 'test.xlsx', sheets: [] }),
        };
        controller = new InternalExportsController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getExportData should delegate type and filters to service', async () => {
        await controller.getExportData('cdp', 'test-search');
        expect(mockService.getExportData).toHaveBeenCalledWith('cdp', { search: 'test-search' });
    });

    it('getExportData should pass empty filters when no search', async () => {
        await controller.getExportData('projects');
        expect(mockService.getExportData).toHaveBeenCalledWith('projects', {});
    });

    it('getExportData should pass empty filters when search is undefined', async () => {
        await controller.getExportData('needs', undefined);
        expect(mockService.getExportData).toHaveBeenCalledWith('needs', {});
    });
});
