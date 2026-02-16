import { GetIndicatorDetailsDto } from '../../../../apps/spd-core-api/src/sub/indicator-advances/dtos/get-indicator-details.dto';
import { plainToInstance } from 'class-transformer';

describe('GetIndicatorDetailsDto', () => {
    it('should transform numeric year string to number', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { year: '2025' });
        expect(dto.year).toBe(2025);
    });

    it('should transform "all" year to "all"', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { year: 'all' });
        expect(dto.year).toBe('all');
    });

    it('should transform empty year to "all"', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { year: '' });
        expect(dto.year).toBe('all');
    });

    it('should transform NaN year string as-is', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { year: 'abc' });
        expect(dto.year).toBe('abc');
    });

    it('should transform numeric month string to number', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { month: '6' });
        expect(dto.month).toBe(6);
    });

    it('should transform "all" month to "all"', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { month: 'all' });
        expect(dto.month).toBe('all');
    });

    it('should handle both year and month', () => {
        const dto = plainToInstance(GetIndicatorDetailsDto, { year: '2025', month: '12' });
        expect(dto.year).toBe(2025);
        expect(dto.month).toBe(12);
    });
});
