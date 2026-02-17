import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VariablesService } from '../../../../apps/spd-core-api/src/masters/variables/services/variables.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('VariablesService', () => {
    let service: VariablesService;
    let mockRepo: any;
    let mockAuditLog: any;
    let mockQb: any;

    const mockVariable = { id: 'var-1', code: 'V001', name: 'Variable 1', observations: 'obs' };

    beforeEach(() => {
        mockQb = createMockQueryBuilder([mockVariable], 1);
        mockRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'var-1' })),
            findOne: jest.fn().mockResolvedValue(mockVariable),
            preload: jest.fn().mockResolvedValue(mockVariable),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        mockAuditLog = {
            logSuccess: jest.fn().mockResolvedValue(undefined),
        };
        service = new VariablesService(mockRepo, mockAuditLog);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create and audit log a variable', async () => {
            const dto = { code: 'V001', name: 'Var 1' } as any;

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith(dto);
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate key' });

            await expect(service.create({ code: 'V001', name: 'Var' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllPaginated', () => {
        it('should return paginated data with defaults', async () => {
            const result = await service.findAllPaginated();

            expect(mockQb.orderBy).toHaveBeenCalledWith('variable.createAt', 'DESC');
            expect(mockQb.skip).toHaveBeenCalledWith(0);
            expect(mockQb.take).toHaveBeenCalledWith(10);
            expect(result.data).toHaveLength(1);
            expect(result.meta.page).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findAllPaginated(1, 10, 'test');

            expect(mockQb.where).toHaveBeenCalled();
        });

        it('should apply valid sortBy', async () => {
            await service.findAllPaginated(1, 10, undefined, 'code', 'ASC');

            expect(mockQb.orderBy).toHaveBeenCalledWith('variable.code', 'ASC');
        });

        it('should use default sortBy for invalid field', async () => {
            await service.findAllPaginated(1, 10, undefined, 'invalid');

            expect(mockQb.orderBy).toHaveBeenCalledWith('variable.createAt', 'DESC');
        });
    });

    describe('findOne', () => {
        it('should return a variable by id', async () => {
            const result = await service.findOne('var-1');

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'var-1' } });
            expect(result).toEqual(mockVariable);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update and audit log a variable', async () => {
            const dto = { name: 'Updated' } as any;
            mockRepo.preload.mockResolvedValue({ ...mockVariable, name: 'Updated' });
            mockRepo.save.mockResolvedValue({ ...mockVariable, name: 'Updated' });

            const result = await service.update('var-1', dto);

            expect(mockRepo.preload).toHaveBeenCalledWith({ id: 'var-1', ...dto });
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });

        it('should throw NotFoundException if preload returns null', async () => {
            mockRepo.preload.mockResolvedValue(null);

            await expect(service.update('bad-id', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on duplicate', async () => {
            mockRepo.preload.mockResolvedValue(mockVariable);
            mockRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate' });

            await expect(service.update('var-1', { code: 'dup' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should remove and audit log a variable', async () => {
            await service.remove('var-1');

            expect(mockRepo.remove).toHaveBeenCalledWith(mockVariable);
            expect(mockAuditLog.logSuccess).toHaveBeenCalled();
        });
    });

    describe('findForSelect', () => {
        it('should return select data with meta', async () => {
            const result = await service.findForSelect();

            expect(mockQb.select).toHaveBeenCalled();
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
        });

        it('should apply search when provided', async () => {
            await service.findForSelect('test');

            expect(mockQb.where).toHaveBeenCalled();
        });
    });
});
