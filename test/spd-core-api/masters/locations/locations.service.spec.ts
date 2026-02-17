import { BadRequestException } from '@nestjs/common';
import { LocationsService } from '../../../../apps/spd-core-api/src/masters/locations/services/locations.service';

function createMockQueryBuilder(resultData: any[] = [], total: number = 0) {
    const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([resultData, total]),
    };
    return qb;
}

describe('LocationsService', () => {
    let service: LocationsService;
    let mockLocationRepo: any;
    let mockCommuneRepo: any;
    let mockQb: any;

    beforeEach(() => {
        mockQb = createMockQueryBuilder([{ id: '1', address: 'Calle 1' }], 1);
        mockLocationRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            create: jest.fn().mockImplementation((dto: any) => ({ ...dto })),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: 'loc-uuid-1' })),
        };
        mockCommuneRepo = {
            findOne: jest.fn().mockResolvedValue({ id: 'commune-1', code: '001', name: 'Comuna 1' }),
        };
        service = new LocationsService(mockLocationRepo, mockCommuneRepo);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a location and normalize address', async () => {
            const dto = { address: 'Calle  1 # 2-3  ', communeId: 'commune-1' } as any;

            const result = await service.create(dto);

            expect(mockCommuneRepo.findOne).toHaveBeenCalledWith({ where: { id: 'commune-1' } });
            expect(mockLocationRepo.create).toHaveBeenCalledWith(dto);
            expect(mockLocationRepo.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException if commune not found', async () => {
            mockCommuneRepo.findOne.mockResolvedValue(null);
            const dto = { address: 'Calle 1', communeId: 'bad-id' } as any;

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException on duplicate entry', async () => {
            mockLocationRepo.save.mockRejectedValue({ code: '23505', detail: 'duplicate key' });

            const dto = { address: 'Calle 1', communeId: 'commune-1' } as any;
            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findForSelect', () => {
        it('should return data with meta', async () => {
            const result = await service.findForSelect();

            expect(mockLocationRepo.createQueryBuilder).toHaveBeenCalledWith('location');
            expect(mockQb.leftJoinAndSelect).toHaveBeenCalled();
            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should apply search filter', async () => {
            await service.findForSelect('test');

            expect(mockQb.andWhere).toHaveBeenCalled();
        });

        it('should filter by communeId', async () => {
            await service.findForSelect(undefined, 'commune-1');

            expect(mockQb.where).toHaveBeenCalledWith(
                'location.communeId = :communeId',
                { communeId: 'commune-1' },
            );
        });

        it('should respect limit and offset', async () => {
            await service.findForSelect(undefined, undefined, 10, 5);

            expect(mockQb.skip).toHaveBeenCalledWith(5);
            expect(mockQb.take).toHaveBeenCalledWith(10);
        });
    });
});
