import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FormulasService } from '../services/formulas.service';
import { CreateFormulaDto } from '../dtos/create-formula.dto';
import { UpdateFormulaDto } from '../dtos/update-formula.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('masters/formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) { }

  @Post()
  @RequirePermission('/masters/formulas', 'CREATE')
  create(@Body() createFormulaDto: CreateFormulaDto) {
    return this.formulasService.create(createFormulaDto);
  }

  @Patch(':id')
  @RequirePermission('/masters/formulas', 'UPDATE')
  update(
    @Param('id') id: string,
    @Body() updateFormulaDto: UpdateFormulaDto,
  ) {
    return this.formulasService.update(id, updateFormulaDto);
  }

  @Get('indicator-data/:indicatorId')
  @RequirePermission('/masters/formulas', 'READ')
  findData(
    @Param('indicatorId') indicatorId: string,
    @Query('type') type: 'action' | 'indicative',
    @Query('year') year: number,
  ) {
    return this.formulasService.findDataForCalculator(indicatorId, type, year);
  }
}
