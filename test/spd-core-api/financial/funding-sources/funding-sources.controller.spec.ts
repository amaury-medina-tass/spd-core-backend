import { FundingSourcesController } from '../../../../apps/spd-core-api/src/financial/funding-sources/controllers/funding-sources.controller';

describe('FundingSourcesController', () => {
    let controller: FundingSourcesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findForSelect: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            delete: jest.fn().mockResolvedValue(undefined),
        };
        controller = new FundingSourcesController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should delegate to service', () => {
        const dto = { name: 'Source A' } as any;
        controller.create(dto);
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    describe('findAll', () => {
        it('should use defaults when params are falsy', () => {
            controller.findAll(0 as any, 0 as any, '', '', 'ASC');
            expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 10, '', '', 'ASC');
        });
    });

    describe('findForSelect', () => {
        it('should use defaults when params are falsy', () => {
            controller.findForSelect('', 0 as any, 0 as any);
            expect(mockService.findForSelect).toHaveBeenCalledWith('', 30, 0);
        });
    });

    it('findOne should delegate to service', () => {
        controller.findOne('id-1');
        expect(mockService.findOne).toHaveBeenCalledWith('id-1');
    });

    it('update should delegate to service', () => {
        const dto = { name: 'Updated' } as any;
        controller.update('id-1', dto);
        expect(mockService.update).toHaveBeenCalledWith('id-1', dto);
    });

    it('delete should delegate to service', () => {
        controller.delete('id-1');
        expect(mockService.delete).toHaveBeenCalledWith('id-1');
    });
});
