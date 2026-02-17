import { SubUserFilterController } from '../../../apps/spd-core-api/src/sub/controllers/sub-user-filter.controller';

describe('SubUserFilterController', () => {
    let controller: SubUserFilterController;
    let mockService: any;

    const mockUser = { sub: 'user-uuid-1', email: 'test@test.com' };

    beforeEach(() => {
        mockService = {
            getIndicativeIndicatorsByUser: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            getActionIndicatorsByUser: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            getVariablesByUser: jest.fn().mockResolvedValue({ data: [], meta: {} }),
        };
        controller = new SubUserFilterController(mockService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getMyIndicativeIndicators', () => {
        it('should use defaults and pass user sub', () => {
            controller.getMyIndicativeIndicators(mockUser as any);
            expect(mockService.getIndicativeIndicatorsByUser).toHaveBeenCalledWith(
                'user-uuid-1', 1, 10, undefined, undefined, undefined,
            );
        });

        it('should pass provided values', () => {
            controller.getMyIndicativeIndicators(mockUser as any, 2, 20, 'search', 'code', 'ASC');
            expect(mockService.getIndicativeIndicatorsByUser).toHaveBeenCalledWith(
                'user-uuid-1', 2, 20, 'search', 'code', 'ASC',
            );
        });
    });

    describe('getMyActionIndicators', () => {
        it('should use defaults and pass user sub', () => {
            controller.getMyActionIndicators(mockUser as any);
            expect(mockService.getActionIndicatorsByUser).toHaveBeenCalledWith(
                'user-uuid-1', 1, 10, undefined, undefined, undefined,
            );
        });
    });

    describe('getMyVariables', () => {
        it('should use defaults and pass user sub', () => {
            controller.getMyVariables(mockUser as any);
            expect(mockService.getVariablesByUser).toHaveBeenCalledWith(
                'user-uuid-1', 1, 10, undefined, undefined, undefined,
            );
        });
    });
});
