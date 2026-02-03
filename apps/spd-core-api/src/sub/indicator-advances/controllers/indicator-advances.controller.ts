import { Controller, Get, Param, Query } from "@nestjs/common";
import { IndicatorAdvancesService } from "../services/indicator-advances.service";
import { GetIndicatorDetailsDto } from "../dtos/get-indicator-details.dto";
import { IndicatorDetailsResponseDto } from "../dtos/indicator-details-response.dto";

@Controller('sub/indicator-advances')
export class IndicatorAdvancesController {
    constructor(private readonly service: IndicatorAdvancesService) { }

    @Get(':type/:indicatorId/detailed')
    async getIndicatorDetails(
        @Param('type') type: 'action' | 'indicative',
        @Param('indicatorId') indicatorId: string,
        @Query() query: GetIndicatorDetailsDto
    ): Promise<IndicatorDetailsResponseDto> {
        return this.service.getIndicatorDetails(
            indicatorId,
            type,
            query.year,
            query.month
        );
    }
}
