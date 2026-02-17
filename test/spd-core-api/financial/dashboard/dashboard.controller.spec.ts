import { DashboardController } from '../../../../apps/spd-core-api/src/financial/dashboard/controllers/dashboard.controller';

describe('DashboardController', () => {
    let controller: DashboardController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            getGlobalData: jest.fn().mockResolvedValue({}),
            getNeedsWithCdps: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            getCdpsByNeedId: jest.fn().mockResolvedValue([]),
            getActivitiesByCdp: jest.fn().mockResolvedValue([]),
            getMasterContractsByCdp: jest.fn().mockResolvedValue([]),
            getCdpsByMasterContract: jest.fn().mockResolvedValue([]),
            getBudgetRecordsByContract: jest.fn().mockResolvedValue([]),
            getProjectBudgetOverview: jest.fn().mockResolvedValue([]),
            getProjectExecutionOverview: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            getMgaActivitiesByProject: jest.fn().mockResolvedValue([]),
            getDetailedActivitiesByMga: jest.fn().mockResolvedValue([]),
            getBudgetModificationsByActivity: jest.fn().mockResolvedValue([]),
        };
        controller = new DashboardController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getGlobalData', () => {
        it('should use defaults when params are falsy', () => {
            controller.getGlobalData();
            expect(mockService.getGlobalData).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should convert params to numbers', () => {
            controller.getGlobalData(2024, 6);
            expect(mockService.getGlobalData).toHaveBeenCalledWith(2024, 6);
        });
    });

    describe('getNeedsWithCdps', () => {
        it('should use defaults', () => {
            controller.getNeedsWithCdps(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.getNeedsWithCdps).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('getCdpsByNeed', () => {
        it('should delegate to service', () => {
            controller.getCdpsByNeed('uuid-1');
            expect(mockService.getCdpsByNeedId).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getActivitiesByCdp', () => {
        it('should delegate to service', () => {
            controller.getActivitiesByCdp('uuid-1');
            expect(mockService.getActivitiesByCdp).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getMasterContractsByCdp', () => {
        it('should delegate to service', () => {
            controller.getMasterContractsByCdp('uuid-1');
            expect(mockService.getMasterContractsByCdp).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getCdpsByMasterContract', () => {
        it('should delegate to service', () => {
            controller.getCdpsByMasterContract('uuid-1');
            expect(mockService.getCdpsByMasterContract).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getBudgetRecordsByContract', () => {
        it('should delegate to service', () => {
            controller.getBudgetRecordsByContract('uuid-1');
            expect(mockService.getBudgetRecordsByContract).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getProjectBudgetOverview', () => {
        it('should delegate to service', () => {
            controller.getProjectBudgetOverview();
            expect(mockService.getProjectBudgetOverview).toHaveBeenCalled();
        });
    });

    describe('getProjectExecutionOverview', () => {
        it('should use defaults', () => {
            controller.getProjectExecutionOverview(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.getProjectExecutionOverview).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('getMgaActivitiesByProject', () => {
        it('should delegate to service', () => {
            controller.getMgaActivitiesByProject('uuid-1');
            expect(mockService.getMgaActivitiesByProject).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getDetailedActivitiesByMga', () => {
        it('should delegate to service', () => {
            controller.getDetailedActivitiesByMga('uuid-1');
            expect(mockService.getDetailedActivitiesByMga).toHaveBeenCalledWith('uuid-1');
        });
    });

    describe('getBudgetModifications', () => {
        it('should delegate to service', () => {
            controller.getBudgetModifications('uuid-1');
            expect(mockService.getBudgetModificationsByActivity).toHaveBeenCalledWith('uuid-1');
        });
    });
});
