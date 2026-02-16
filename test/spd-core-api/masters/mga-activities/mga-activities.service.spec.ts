import { MgaActivitiesService } from '../../../../apps/spd-core-api/src/masters/mga-activities/services/mga-activities.service';

describe('MgaActivitiesService', () => {
    let service: MgaActivitiesService;
    let mockMgaRepo: any;
    let mockRelationRepo: any;
    let mockDetailedRepo: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockMgaRepo = {
            create: jest.fn().mockImplementation(data => data),
            save: jest.fn().mockImplementation(data => Promise.resolve({ id: 'mga-1', ...data })),
            createQueryBuilder: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            }),
        };
        mockRelationRepo = {
            create: jest.fn().mockImplementation(data => data),
            save: jest.fn().mockResolvedValue([]),
        };
        mockDetailedRepo = {};
        mockAuditLog = { logSuccess: jest.fn().mockResolvedValue(undefined) };

        service = new MgaActivitiesService(
            mockMgaRepo, mockRelationRepo, mockDetailedRepo, mockAuditLog,
        );
    });

    describe('create', () => {
        it('should create MGA activity with relations', async () => {
            const dto = { code: 'MGA01', name: 'Test', detailedActivityIds: ['da-1', 'da-2'] } as any;
            await service.create(dto);

            expect(mockMgaRepo.save).toHaveBeenCalled();
            expect(mockRelationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should create MGA activity without relations', async () => {
            const dto = { code: 'MGA02', name: 'Test2' } as any;
            await service.create(dto);

            expect(mockMgaRepo.save).toHaveBeenCalled();
            expect(mockRelationRepo.save).not.toHaveBeenCalled();
        });
    });
});
