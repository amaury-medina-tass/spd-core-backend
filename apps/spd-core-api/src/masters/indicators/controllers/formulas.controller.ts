import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FormulasService } from '../services/formulas.service';
import { CreateFormulaDto } from '../dtos/create-formula.dto';
import { UpdateFormulaDto } from '../dtos/update-formula.dto';

@Controller('masters/formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) { }

  @Post()
  create(@Body() createFormulaDto: CreateFormulaDto) {
    return this.formulasService.create(createFormulaDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormulaDto: UpdateFormulaDto,
  ) {
    return this.formulasService.update(id, updateFormulaDto);
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
