import { MgaActivitiesController } from '../../../../apps/spd-core-api/src/masters/mga-activities/controllers/mga-activities.controller';

describe('MgaActivitiesController', () => {
    let controller: MgaActivitiesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            getDetailedActivitiesForMga: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            addDetailedRelation: jest.fn().mockResolvedValue({ id: '1' }),
            removeDetailedRelation: jest.fn().mockResolvedValue(undefined),
            getDetailedRelations: jest.fn().mockResolvedValue([]),
        };
        controller = new MgaActivitiesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { code: 'MGA-01' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('findOne', () => {
        it('should use defaults for optional params', () => {
            controller.findOne('id-1');
            expect(mockService.findOne).toHaveBeenCalledWith('id-1', 1, 10, undefined);
        });

        it('should pass optional params', () => {
            controller.findOne('id-1', 2, 5, 'search');
            expect(mockService.findOne).toHaveBeenCalledWith('id-1', 2, 5, 'search');
        });
    });

    describe('getDetailedActivitiesForMga', () => {
        it('should use defaults', () => {
            controller.getDetailedActivitiesForMga('id-1');
            expect(mockService.getDetailedActivitiesForMga).toHaveBeenCalledWith('id-1', 'all', 1, 20, undefined);
        });
    });

    it('update should delegate to service', () => {
        const dto = { name: 'Updated' } as any;
        controller.update('id-1', dto);
        expect(mockService.update).toHaveBeenCalledWith('id-1', dto);
    });

    it('addDetailedRelation should delegate to service', () => {
        controller.addDetailedRelation('mga-1', 'da-1');
        expect(mockService.addDetailedRelation).toHaveBeenCalledWith('mga-1', 'da-1');
    });

    it('removeDetailedRelation should delegate to service', () => {
        controller.removeDetailedRelation('mga-1', 'da-1');
        expect(mockService.removeDetailedRelation).toHaveBeenCalledWith('mga-1', 'da-1');
    });

    it('getDetailedRelations should delegate to service', () => {
        controller.getDetailedRelations('mga-1');
        expect(mockService.getDetailedRelations).toHaveBeenCalledWith('mga-1');
    });
});
