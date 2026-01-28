import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FormulasService } from '../services/formulas.service';
import { CreateFormulaDto } from '../dtos/create-formula.dto';

@Controller('masters/formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Post()
  create(@Body() createFormulaDto: CreateFormulaDto) {
    return this.formulasService.create(createFormulaDto);
  }

  @Get('indicator-data/:indicatorId')
  findData(
    @Param('indicatorId') indicatorId: string,
    @Query('type') type: 'action' | 'indicative',
    @Query('year') year: number,
  ) {
    return this.formulasService.findDataForCalculator(indicatorId, type, year);
  }
}
