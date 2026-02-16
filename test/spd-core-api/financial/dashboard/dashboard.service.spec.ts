import { DashboardService } from '../../../../apps/spd-core-api/src/financial/dashboard/services/dashboard.service';

function createMockQueryBuilder(rawResult?: any) {
    const qb: any = {};
    qb.select = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.innerJoin = jest.fn().mockReturnValue(qb);
    qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orWhere = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    qb.addGroupBy = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.offset = jest.fn().mockReturnValue(qb);
    qb.limit = jest.fn().mockReturnValue(qb);
    qb.clone = jest.fn().mockReturnValue(qb);
    qb.getOne = jest.fn().mockResolvedValue(rawResult ?? null);
    qb.getMany = jest.fn().mockResolvedValue([]);
    qb.getCount = jest.fn().mockResolvedValue(0);
    qb.getRawOne = jest.fn().mockResolvedValue(rawResult ?? { total: '0' });
    qb.getRawMany = jest.fn().mockResolvedValue([]);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return qb;
}

function createMockRepo() {
    return {
        createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
        count: jest.fn().mockResolvedValue(0),
        find: jest.fn().mockResolvedValue([]),
    };
}

describe('DashboardService', () => {
    let service: DashboardService;
    let repos: Record<string, any>;

    beforeEach(() => {
        repos = {
            needRepo: createMockRepo(),
            cdpRepo: createMockRepo(),
            cdpPositionRepo: createMockRepo(),
            cdpFundingRepo: createMockRepo(),
            cdpProjectRepo: createMockRepo(),
            masterContractRepo: createMockRepo(),
            contractCdpRepo: createMockRepo(),
            budgetRecordRepo: createMockRepo(),
            projectRepo: createMockRepo(),
            detailedActivityRepo: createMockRepo(),
            mgaActivityRepo: createMockRepo(),
            mgaDetailedRelRepo: createMockRepo(),
            budgetModRepo: createMockRepo(),
        };

        service = new DashboardService(
            repos.needRepo,
            repos.cdpRepo,
            repos.cdpPositionRepo,
            repos.cdpFundingRepo,
            repos.cdpProjectRepo,
            repos.masterContractRepo,
            repos.contractCdpRepo,
            repos.budgetRecordRepo,
            repos.projectRepo,
            repos.detailedActivityRepo,
            repos.mgaActivityRepo,
            repos.mgaDetailedRelRepo,
            repos.budgetModRepo,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getGlobalData', () => {
        it('returns global metrics', async () => {
            const projectQb = createMockQueryBuilder();
            projectQb.getRawOne.mockResolvedValue({
                totalInitialBudget: '1000',
                totalCurrentBudget: '1200',
                totalExecution: '300',
                totalProjects: '5',
            });
            repos.projectRepo.createQueryBuilder.mockReturnValue(projectQb);

            const modQb = createMockQueryBuilder();
            modQb.clone.mockReturnValue(modQb);
            modQb.getRawOne.mockResolvedValue({ total: '100' });
            repos.budgetModRepo.createQueryBuilder.mockReturnValue(modQb);

            repos.needRepo.count.mockResolvedValue(10);
            repos.cdpRepo.count.mockResolvedValue(20);
            repos.masterContractRepo.count.mockResolvedValue(5);

            const result = await service.getGlobalData();

            expect(result.totalInitialBudget).toBe(1000);
            expect(result.totalCurrentBudget).toBe(1200);
            expect(result.totalExecution).toBe(300);
            expect(result.totalProjects).toBe(5);
            expect(result.totalNeeds).toBe(10);
            expect(result.totalCdps).toBe(20);
            expect(result.totalContracts).toBe(5);
        });

        it('accepts year and month filters', async () => {
            const projectQb = createMockQueryBuilder();
            projectQb.getRawOne.mockResolvedValue({
                totalInitialBudget: '0', totalCurrentBudget: '0',
                totalExecution: '0', totalProjects: '0',
            });
            repos.projectRepo.createQueryBuilder.mockReturnValue(projectQb);

            const modQb = createMockQueryBuilder();
            modQb.clone.mockReturnValue(modQb);
            modQb.getRawOne.mockResolvedValue({ total: '0' });
            repos.budgetModRepo.createQueryBuilder.mockReturnValue(modQb);

            const result = await service.getGlobalData(2024, 6);

            expect(modQb.where).toHaveBeenCalled();
            expect(modQb.andWhere).toHaveBeenCalled();
        });

        it('accepts year only (no month)', async () => {
            const projectQb = createMockQueryBuilder();
            projectQb.getRawOne.mockResolvedValue({
                totalInitialBudget: '0', totalCurrentBudget: '0',
                totalExecution: '0', totalProjects: '0',
            });
            repos.projectRepo.createQueryBuilder.mockReturnValue(projectQb);

            const modQb = createMockQueryBuilder();
            modQb.clone.mockReturnValue(modQb);
            modQb.getRawOne.mockResolvedValue({ total: '0' });
            repos.budgetModRepo.createQueryBuilder.mockReturnValue(modQb);

            const result = await service.getGlobalData(2024);

            expect(modQb.where).toHaveBeenCalled();
            // andWhere for month should NOT have been called because month is undefined
            expect(result.totalInitialBudget).toBe(0);
        });
    });

    describe('getNeedsWithCdps', () => {
        it('returns paginated needs', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[{ id: '1', code: 'N-01' }], 1]);
            repos.needRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getNeedsWithCdps();

            expect(result.data.length).toBe(1);
            expect(result.meta.total).toBe(1);
        });

        it('applies search', async () => {
            const qb = createMockQueryBuilder();
            repos.needRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getNeedsWithCdps(1, 10, 'test');

            expect(qb.where).toHaveBeenCalled();
        });

        it('sorts by relation field', async () => {
            const qb = createMockQueryBuilder();
            repos.needRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getNeedsWithCdps(1, 10, undefined, 'previousStudy.code', 'ASC');

            expect(qb.orderBy).toHaveBeenCalledWith('previousStudy.code', 'ASC');
        });
    });

    describe('getCdpsByNeedId', () => {
        it('returns CDPs mapped with numeric values', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', number: 'CDP-01', totalValue: '5000', balance: '2000' },
            ]);
            repos.masterContractRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getCdpsByNeedId('need-1');

            expect(result[0].totalValue).toBe(5000);
            expect(result[0].balance).toBe(2000);
        });
    });

    describe('getActivitiesByCdp', () => {
        it('returns activities with percentage', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'A-01', name: 'Act', projectCode: 'P-01', cpc: '10', budgetCeiling: '1000', assignedValue: '500', fundingBalance: '500' },
            ]);
            repos.cdpFundingRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getActivitiesByCdp('cdp-1');

            expect(result[0].percentage).toBe(50);
            expect(result[0].cpc).toBe(10);
        });

        it('handles zero budget ceiling (0% percentage)', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'A-01', name: 'Act', projectCode: 'P-01', cpc: null, budgetCeiling: '0', assignedValue: '0', fundingBalance: '0' },
            ]);
            repos.cdpFundingRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getActivitiesByCdp('cdp-1');

            expect(result[0].percentage).toBe(0);
            expect(result[0].cpc).toBeNull();
        });
    });

    describe('getMasterContractsByCdp', () => {
        it('returns mapped contracts', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([{
                masterContract: {
                    id: 'mc-1', number: 'MC-001', object: 'Test', totalValue: 1000,
                    startDate: '2024-01-01', endDate: '2024-12-31', state: 'ACTIVE',
                    need: { code: 'N-01' },
                },
            }]);
            repos.contractCdpRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMasterContractsByCdp('cdp-1');

            expect(result[0].number).toBe('MC-001');
            expect(result[0].needCode).toBe('N-01');
        });

        it('handles null need (needCode = null)', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([{
                masterContract: {
                    id: 'mc-2', number: 'MC-002', object: 'No need', totalValue: 500,
                    startDate: '2024-01-01', endDate: '2024-06-30', state: 'ACTIVE',
                    need: null,
                },
            }]);
            repos.contractCdpRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMasterContractsByCdp('cdp-2');

            expect(result[0].needCode).toBeNull();
        });
    });

    describe('getCdpsByMasterContract', () => {
        it('returns CDPs for a contract', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', number: 'CDP-01', totalValue: '5000', balance: '3000' },
            ]);
            repos.contractCdpRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getCdpsByMasterContract('mc-1');

            expect(result[0].totalValue).toBe(5000);
        });
    });

    describe('getBudgetRecordsByContract', () => {
        it('returns records with percentage', async () => {
            repos.budgetRecordRepo.find.mockResolvedValue([
                { id: '1', number: 'BR-01', totalValue: 1000, balance: 400 },
            ]);

            const result = await service.getBudgetRecordsByContract('mc-1');

            expect(result[0].percentage).toBe(60);
        });

        it('handles zero total value', async () => {
            repos.budgetRecordRepo.find.mockResolvedValue([
                { id: '1', number: 'BR-01', totalValue: 0, balance: 0 },
            ]);

            const result = await service.getBudgetRecordsByContract('mc-1');

            expect(result[0].percentage).toBe(0);
        });
    });

    describe('getProjectBudgetOverview', () => {
        it('returns overview with computed fields', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'P-01', name: 'Proj', initialBudget: '1000', currentBudget: '1200', execution: '600', dependencyName: 'Dep' },
            ]);
            repos.projectRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getProjectBudgetOverview();

            expect(result[0].available).toBe(600);
            expect(result[0].executionPercentage).toBe(50);
        });

        it('handles zero currentBudget', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'P-01', name: 'Proj', initialBudget: '0', currentBudget: '0', execution: '0', dependencyName: null },
            ]);
            repos.projectRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getProjectBudgetOverview();

            expect(result[0].executionPercentage).toBe(0);
        });
    });

    describe('getProjectExecutionOverview', () => {
        it('returns paginated execution data', async () => {
            const qb = createMockQueryBuilder();
            qb.getCount.mockResolvedValue(1);
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'P-01', name: 'Proj', initialBudget: '1000', currentBudget: '1200', execution: '600', dependencyName: 'Dep', mgaCount: '3' },
            ]);
            repos.projectRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getProjectExecutionOverview();

            expect(result.data[0].executionPercentage).toBe(50);
            expect(result.data[0].mgaActivitiesCount).toBe(3);
        });

        it('applies search', async () => {
            const qb = createMockQueryBuilder();
            repos.projectRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getProjectExecutionOverview(1, 10, 'test');

            expect(qb.where).toHaveBeenCalled();
        });
    });

    describe('getMgaActivitiesByProject', () => {
        it('returns activities with execution metrics', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'MGA-01', name: 'MGA', activityDate: '2024-01-01', totalValue: '1000', totalBalance: '400', detailedCount: '2' },
            ]);
            repos.mgaActivityRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMgaActivitiesByProject('proj-1');

            expect(result[0].executedValue).toBe(600);
            expect(result[0].executionPercentage).toBe(60);
            expect(result[0].detailedActivitiesCount).toBe(2);
        });

        it('handles zero totalValue', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '2', code: 'MGA-02', name: 'MGA Zero', activityDate: null, totalValue: '0', totalBalance: '0', detailedCount: '0' },
            ]);
            repos.mgaActivityRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMgaActivitiesByProject('proj-2');

            expect(result[0].executedValue).toBe(0);
            expect(result[0].executionPercentage).toBe(0);
        });
    });

    describe('getDetailedActivitiesByMga', () => {
        it('returns detailed activities', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '1', code: 'DA-01', name: 'Detail', budgetCeiling: '1000', balance: '600', projectCode: 'P-01', cdpCount: '1' },
            ]);
            repos.mgaDetailedRelRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getDetailedActivitiesByMga('mga-1');

            expect(result[0].executedValue).toBe(400);
            expect(result[0].executionPercentage).toBe(40);
        });

        it('handles zero budget ceiling', async () => {
            const qb = createMockQueryBuilder();
            qb.getRawMany.mockResolvedValue([
                { id: '2', code: 'DA-02', name: 'Zero', budgetCeiling: '0', balance: '0', projectCode: 'P-02', cdpCount: '0' },
            ]);
            repos.mgaDetailedRelRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getDetailedActivitiesByMga('mga-2');

            expect(result[0].executedValue).toBe(0);
            expect(result[0].executionPercentage).toBe(0);
        });
    });

    describe('getBudgetModificationsByActivity', () => {
        it('returns categorized modifications', async () => {
            repos.budgetModRepo.find.mockResolvedValue([
                { id: '1', modificationType: 'ADDITION', value: 500, dateIssue: '2024-01-01', legalDocument: 'D1', description: 'Add', previousBalance: 100, newBalance: 600 },
                { id: '2', modificationType: 'REDUCTION', value: 200, dateIssue: '2024-02-01', legalDocument: 'D2', description: 'Red', previousBalance: 600, newBalance: 400 },
                { id: '3', modificationType: 'TRANSFER', value: 100, dateIssue: '2024-03-01', legalDocument: 'D3', description: 'Tran', previousBalance: 400, newBalance: 300 },
            ]);

            const result = await service.getBudgetModificationsByActivity('act-1');

            expect(result.additions.length).toBe(1);
            expect(result.reductions.length).toBe(1);
            expect(result.transfers.length).toBe(1);
            expect(result.totalAdditions).toBe(500);
            expect(result.totalReductions).toBe(200);
            expect(result.totalTransfers).toBe(1);
        });
    });
});
