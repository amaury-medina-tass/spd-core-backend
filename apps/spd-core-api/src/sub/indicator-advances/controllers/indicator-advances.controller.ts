import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { IndicatorAdvancesService } from "../services/indicator-advances.service";
import { GetIndicatorDetailsDto } from "../dtos/get-indicator-details.dto";
import { IndicatorDetailsResponseDto } from "../dtos/indicator-details-response.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sub/indicator-advances')
export class IndicatorAdvancesController {
    constructor(private readonly service: IndicatorAdvancesService) { }

    @Get(':type/:indicatorId/detailed')
    @RequirePermission("/sub/indicator-advances", "READ")
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
