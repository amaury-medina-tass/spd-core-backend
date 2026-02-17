import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectActionIndicatorRelationsService } from '../../../../apps/spd-core-api/src/masters/indicators/services/action-plan/project-action-indicator-relations.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('ProjectActionIndicatorRelationsService', () => {
    let service: ProjectActionIndicatorRelationsService;
    let mockRelationRepo: any;
    let mockIndicatorRepo: any;
    let mockProjectRepo: any;
    let mockAuditLog: any;

    const mockIndicator = { id: 'ind-1', code: 'IND001', name: 'Indicator 1' };
    const mockProject = { id: 'proj-1', code: 'PROJ001', name: 'Project 1' };
    const mockRelation = { id: 'rel-1', projectId: 'proj-1', indicatorId: 'ind-1' };

    beforeEach(() => {
        mockRelationRepo = {
            create: jest.fn().mockImplementation((data: any) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'rel-1' })),
            findOne: jest.fn().mockResolvedValue(mockRelation),
            find: jest.fn().mockResolvedValue([]),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockIndicatorRepo = {
            findOne: jest.fn().mockResolvedValue(mockIndicator),
        };
        mockProjectRepo = {
            findOne: jest.fn().mockResolvedValue(mockProject),
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder([mockProject], 1)),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new ProjectActionIndicatorRelationsService(
            mockRelationRepo,
            mockIndicatorRepo,
            mockProjectRepo,
            mockAuditLog,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('associate', () => {
        it('should associate a project with an indicator', async () => {
            const result = await service.associate('ind-1', 'proj-1');

            expect(mockIndicatorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
            expect(mockProjectRepo.findOne).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
            expect(mockRelationRepo.create).toHaveBeenCalledWith({ projectId: 'proj-1', indicatorId: 'ind-1' });
            expect(mockRelationRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.associate('bad-id', 'proj-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if project not found', async () => {
            mockProjectRepo.findOne.mockResolvedValue(null);

            await expect(service.associate('ind-1', 'bad-id')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRelationRepo.save.mockRejectedValue({ code: '23505' });

            await expect(service.associate('ind-1', 'proj-1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('disassociate', () => {
        it('should disassociate a project from an indicator', async () => {
            await service.disassociate('ind-1', 'proj-1');

            expect(mockRelationRepo.findOne).toHaveBeenCalledWith({ where: { projectId: 'proj-1', indicatorId: 'ind-1' } });
            expect(mockRelationRepo.remove).toHaveBeenCalledWith(mockRelation);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });

        it('should throw NotFoundException if relation not found', async () => {
            mockRelationRepo.findOne.mockResolvedValue(null);

            await expect(service.disassociate('ind-1', 'proj-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findPaginated', () => {
        it('should return paginated associated projects', async () => {
            mockRelationRepo.find.mockResolvedValue([{ projectId: 'proj-1' }]);
            const mockQb = createMockQueryBuilder([mockProject], 1);
            mockProjectRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'associated');

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should return empty response for associated when no relations', async () => {
            mockRelationRepo.find.mockResolvedValue([]);

            const result = await service.findPaginated('ind-1', 'associated');

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
        });

        it('should return available projects', async () => {
            mockRelationRepo.find.mockResolvedValue([{ projectId: 'proj-1' }]);
            const mockQb = createMockQueryBuilder([{ id: 'proj-2' }], 1);
            mockProjectRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'available');

            expect(mockQb.where).toHaveBeenCalled();
            expect(result.data).toBeDefined();
        });

        it('should return all projects with isAssociated flag', async () => {
            mockRelationRepo.find.mockResolvedValue([{ projectId: 'proj-1' }]);
            const mockQb = createMockQueryBuilder([{ id: 'proj-1' }], 1);
            mockProjectRepo.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findPaginated('ind-1', 'all');

            expect(result.data[0]).toHaveProperty('isAssociated');
        });

        it('should throw NotFoundException if indicator not found', async () => {
            mockIndicatorRepo.findOne.mockResolvedValue(null);

            await expect(service.findPaginated('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('should apply search filter', async () => {
            mockRelationRepo.find.mockResolvedValue([]);
            const mockQb = createMockQueryBuilder([], 0);
            mockProjectRepo.createQueryBuilder.mockReturnValue(mockQb);

            await service.findPaginated('ind-1', 'all', 1, 20, 'test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });
    });
});
