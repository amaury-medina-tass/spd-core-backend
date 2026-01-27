import { Controller, Get, Param, Query } from '@nestjs/common';
import { FormulasService } from '../services/formulas.service';

@Controller('masters/formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Get('indicator-data/:indicatorId')
  findData(
    @Param('indicatorId') indicatorId: string,
    @Query('type') type: 'action' | 'indicative',
    @Query('year') year: number,
  ) {
    return this.formulasService.findDataForCalculator(indicatorId, type, year);
  }
}
