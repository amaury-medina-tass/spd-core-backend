import { BadRequestException } from '@nestjs/common';
import { VariableAdvancesController } from '../../../../apps/spd-core-api/src/sub/variable-advances/controllers/variable-advances.controller';

describe('VariableAdvancesController', () => {
    let controller: VariableAdvancesController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findAllPaginated: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findAllByActionIndicator: jest.fn().mockResolvedValue({ data: [] }),
            findAllByIndicativeIndicator: jest.fn().mockResolvedValue({ data: [] }),
            getVariableLocations: jest.fn().mockResolvedValue([]),
            getIndicatorVariablesLocations: jest.fn().mockResolvedValue([]),
            getVariableAdvancesWithLocations: jest.fn().mockResolvedValue({ advances: [] }),
            getVariableDetails: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
        };
        controller = new VariableAdvancesController(mockService);
    });

    describe('getDetails', () => {
        it('should parse year and month as numbers', async () => {
            await controller.getDetails('uuid', '2025', '6');
            expect(mockService.getVariableDetails).toHaveBeenCalledWith('uuid', 2025, 6);
        });

        it('should pass undefined for "all" year', async () => {
            await controller.getDetails('uuid', 'all', 'all');
            expect(mockService.getVariableDetails).toHaveBeenCalledWith('uuid', undefined, undefined);
        });

        it('should not throw for NaN year (NaN is falsy)', async () => {
            await controller.getDetails('uuid', 'abc', undefined);
            expect(mockService.getVariableDetails).toHaveBeenCalledWith('uuid', NaN, undefined);
        });

        it('should not throw for NaN month (NaN is falsy)', async () => {
            await controller.getDetails('uuid', '2025', 'abc');
            expect(mockService.getVariableDetails).toHaveBeenCalledWith('uuid', 2025, NaN);
        });

        it('should pass undefined when year/month not provided', async () => {
            await controller.getDetails('uuid', undefined, undefined);
            expect(mockService.getVariableDetails).toHaveBeenCalledWith('uuid', undefined, undefined);
        });
    });

    describe('getIndicatorVariablesLocations', () => {
        it('should throw BadRequestException for invalid type', () => {
            expect(() => controller.getIndicatorVariablesLocations('uuid', 'invalid' as any))
                .toThrow(BadRequestException);
        });

        it('should call service for indicative type', () => {
            controller.getIndicatorVariablesLocations('uuid', 'indicative');
            expect(mockService.getIndicatorVariablesLocations).toHaveBeenCalledWith('uuid', 'indicative');
        });

        it('should call service for action type', () => {
            controller.getIndicatorVariablesLocations('uuid', 'action');
            expect(mockService.getIndicatorVariablesLocations).toHaveBeenCalledWith('uuid', 'action');
        });
    });
});
