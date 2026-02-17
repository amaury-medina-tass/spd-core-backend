import { NotFoundException } from '@nestjs/common';
import { InternalExportsService } from '../../../apps/spd-core-api/src/internal/internal-exports.service';

describe('InternalExportsService', () => {
    let service: InternalExportsService;
    let mockActivitiesBuilder: any;
    let mockCdpBuilder: any;
    let mockNeedsBuilder: any;
    let mockContractsBuilder: any;
    let mockProjectsBuilder: any;
    let mockPreviousStudiesBuilder: any;
    let mockPoaiPpaBuilder: any;
    let mockDashboardBuilder: any;
    let mockIndicatorsBuilder: any;

    const mockExportResult = { fileName: 'test.xlsx', sheets: [] };

    beforeEach(() => {
        mockActivitiesBuilder = {
            buildMgaActivitiesExport: jest.fn().mockResolvedValue(mockExportResult),
            buildActivitiesExport: jest.fn().mockResolvedValue(mockExportResult),
        };
        mockCdpBuilder = { buildCdpExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockNeedsBuilder = { buildNeedsExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockContractsBuilder = { buildContractsExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockProjectsBuilder = { buildProjectsExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockPreviousStudiesBuilder = { buildPreviousStudiesExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockPoaiPpaBuilder = { buildPoaiPpaExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockDashboardBuilder = { buildFinancialDashboardExport: jest.fn().mockResolvedValue(mockExportResult) };
        mockIndicatorsBuilder = {
            buildIndicatorsExport: jest.fn().mockResolvedValue(mockExportResult),
            buildVariablesExport: jest.fn().mockResolvedValue(mockExportResult),
        };

        service = new InternalExportsService(
            mockActivitiesBuilder,
            mockCdpBuilder,
            mockNeedsBuilder,
            mockContractsBuilder,
            mockProjectsBuilder,
            mockPreviousStudiesBuilder,
            mockPoaiPpaBuilder,
            mockDashboardBuilder,
            mockIndicatorsBuilder,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it.each([
        ['mga-activities', 'buildMgaActivitiesExport', 'activitiesBuilder'],
        ['activities', 'buildActivitiesExport', 'activitiesBuilder'],
        ['cdp', 'buildCdpExport', 'cdpBuilder'],
        ['needs', 'buildNeedsExport', 'needsBuilder'],
        ['contracts', 'buildContractsExport', 'contractsBuilder'],
        ['projects', 'buildProjectsExport', 'projectsBuilder'],
        ['previous-studies', 'buildPreviousStudiesExport', 'previousStudiesBuilder'],
        ['poai-ppa', 'buildPoaiPpaExport', 'poaiPpaBuilder'],
        ['indicators', 'buildIndicatorsExport', 'indicatorsBuilder'],
        ['variables', 'buildVariablesExport', 'indicatorsBuilder'],
        ['financial-dashboard', 'buildFinancialDashboardExport', 'dashboardBuilder'],
    ])('getExportData(%s) should delegate to %s', async (type, method, builderName) => {
        const filters = { search: 'test' };
        const builderMap: Record<string, any> = {
            activitiesBuilder: mockActivitiesBuilder,
            cdpBuilder: mockCdpBuilder,
            needsBuilder: mockNeedsBuilder,
            contractsBuilder: mockContractsBuilder,
            projectsBuilder: mockProjectsBuilder,
            previousStudiesBuilder: mockPreviousStudiesBuilder,
            poaiPpaBuilder: mockPoaiPpaBuilder,
            dashboardBuilder: mockDashboardBuilder,
            indicatorsBuilder: mockIndicatorsBuilder,
        };

        const result = await service.getExportData(type, filters);

        expect(builderMap[builderName][method]).toHaveBeenCalledWith(filters);
        expect(result).toEqual(mockExportResult);
    });

    it('getExportData should throw NotFoundException for unknown type', async () => {
        await expect(service.getExportData('unknown-type')).rejects.toThrow(NotFoundException);
    });
});
