import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IndicativePlanIndicator } from '../entities/indicative-plan/indicative-plan-indicator.entity';
import { ActionPlanIndicator } from '../entities/action-plan/action-plan-indicator.entity';
import { ActionPlanIndicatorGoal } from '../entities/action-plan/action-plan-indicator-goal.entity';
import { ActionPlanIndicatorQuadrennium } from '../entities/action-plan/action-plan-indicator-quadrennium.entity';
import { VariableActionRelation } from '../entities/action-plan/variable-action-relation.entity';
import { VariableIndicativeRelation } from '../entities/indicative-plan/variable-indicative-relation.entity';
import { IndicativePlanIndicatorGoal } from '../entities/indicative-plan/indicative-plan-indicator-goal.entity';
import { IndicativePlanIndicatorQuadrennium } from '../entities/indicative-plan/indicative-plan-indicator-quadrennium.entity';
import { VariableGoal } from '../../variables/entities/variable-goal.entity';
import { VariableQuadrennium } from '../../variables/entities/variable-quadrennium.entity';
import { Formula } from '../entities/formula.entity';
import { CreateFormulaDto } from '../dtos/create-formula.dto';
import { UpdateFormulaDto } from '../dtos/update-formula.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { VariableAdvancesService } from '../../../sub/variable-advances/services/variable-advances.service';
import { AuditLogService } from '@common/cosmosdb/audit-log.service';
import { AuditAction, AuditEntityType } from '@common/types/audit.types';
import { ErrorCodes } from '@common/errors/error-codes';
import { SYSTEM_NAME } from '../../../shared/constants';

@Injectable()
export class FormulasService {
  constructor(
    @InjectRepository(IndicativePlanIndicator)
    private readonly indicativeIndicatorRepo: Repository<IndicativePlanIndicator>,
    @InjectRepository(ActionPlanIndicator)
    private readonly actionIndicatorRepo: Repository<ActionPlanIndicator>,
    @InjectRepository(VariableActionRelation)
    private readonly variableActionRelationRepo: Repository<VariableActionRelation>,
    @InjectRepository(VariableIndicativeRelation)
    private readonly variableIndicativeRelationRepo: Repository<VariableIndicativeRelation>,
    @InjectRepository(VariableGoal)
    private readonly variableGoalRepo: Repository<VariableGoal>,
    @InjectRepository(VariableQuadrennium)
    private readonly variableQuadrenniumRepo: Repository<VariableQuadrennium>,
    @InjectRepository(Formula)
    private readonly formulaRepo: Repository<Formula>,
    @Inject(forwardRef(() => VariableAdvancesService))
    private readonly variableAdvancesService: VariableAdvancesService,
    private readonly auditLog: AuditLogService,
  ) { }

  async create(createFormulaDto: CreateFormulaDto) {
    if (
      (!createFormulaDto.indicativeIndicatorId &&
        !createFormulaDto.actionIndicatorId) ||
      (createFormulaDto.indicativeIndicatorId &&
        createFormulaDto.actionIndicatorId)
    ) {
      throw new BadRequestException({
        message: 'Must provide exactly one of indicativeIndicatorId or actionIndicatorId',
        code: ErrorCodes.FORMULA_INVALID_INDICATOR,
      });
    }

    const formula = this.formulaRepo.create(createFormulaDto);
    const saved = await this.formulaRepo.save(formula);

    await this.auditLog.logSuccess(AuditAction.FORMULA_CREATED, AuditEntityType.FORMULA, saved.id, {
      entityName: saved.expression ?? `Formula ${saved.id}`,
      system: SYSTEM_NAME,
      metadata: { indicativeIndicatorId: saved.indicativeIndicatorId, actionIndicatorId: saved.actionIndicatorId },
    });

    // Trigger recalculation
    // We don't await this to keep response fast? Or consistent? 
    // User said "Cada que se actualice... tiene que recalcular". Usually implies synchronous or guaranteed eventual consistency.
    // I'll make it async but awaited to ensure it runs.
    await this.variableAdvancesService.recalculateForFormula(saved);

    return saved;
  }

  async update(id: string, updateFormulaDto: UpdateFormulaDto) {
    const formula = await this.formulaRepo.preload({
      id,
      ...updateFormulaDto,
    });

    if (!formula) {
      throw new NotFoundException({ message: `Formula with ID ${id} not found`, code: ErrorCodes.FORMULA_NOT_FOUND });
    }

    const saved = await this.formulaRepo.save(formula);

    await this.auditLog.logSuccess(AuditAction.FORMULA_UPDATED, AuditEntityType.FORMULA, saved.id, {
      entityName: saved.expression ?? `Formula ${saved.id}`,
      system: SYSTEM_NAME,
    });

    await this.variableAdvancesService.recalculateForFormula(saved);
    return saved;
  }

  async findDataForCalculator(
    indicatorId: string,
    type: 'action' | 'indicative',
    year: number,
  ) {
    if (type === 'action') {
      return this.getActionPlanData(indicatorId, year);
    } else if (type === 'indicative') {
      return this.getIndicativePlanData(indicatorId, year);
    } else {
      throw new BadRequestException(
        'Invalid type. Must be "action" or "indicative".',
      );
    }
  }

  private async getActionPlanData(indicatorId: string, year: number) {
    const indicator = await this.actionIndicatorRepo.findOne({
      where: { id: indicatorId },
      relations: ['unitMeasure', 'formulas'],
    });

    if (!indicator) {
      throw new NotFoundException({
        message: `Action Plan Indicator with ID ${indicatorId} not found`,
        code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
      });
    }

    // Fetch goals and quadrenniums manually if they are separate entities and no relation is set up in entity
    // However, usually they are set up. Assuming they are accessible via query builder or eager load if relations exist.
    // Based on file names `action-plan-indicator-goal.entity.ts`, I assume relation exists.
    // Let's refetch with relations if my previous assumption was correct or check entity.
    // I'll use a separate query to be safe or assuming the relation name is 'goals' and 'quadrenniums' if standard naming.
    // Given I cannot see the relation definitions inside `ActionPlanIndicator` right now (I only saw the file list but not full content of all files),
    // I will try to fetch them assuming standard naming or use query builder.
    // Actually, let's look at `ActionPlanIndicator` content I saw earlier (Step 60).
    // It DOES NOT have `goals` or `quadrenniums` relations defined in the content I saw!
    // It only has `unitMeasure`.
    // Wait, I saw `action-plan-indicator-goal.entity.ts` exist.
    // This implies the relation is likely on the Goal entity pointing TO the indicator.
    // I need to fetch goals/quadrenniums separately for the indicator too.

    const [indicatorGoals, indicatorQuadrenniums] = await Promise.all([
      this.actionIndicatorRepo.manager.find(ActionPlanIndicatorGoal, {
        where: { indicatorId, year },
      }),
      this.actionIndicatorRepo.manager.find(ActionPlanIndicatorQuadrennium, {
        where: { indicatorId },
      }),
    ]);

    const variableRelations = await this.variableActionRelationRepo.find({
      where: { indicatorId },
      relations: ['variable'],
    });

    const variableIds = variableRelations.map((vr) => vr.variableId);

    let variableGoals: VariableGoal[] = [];
    let variableQuadrenniums: VariableQuadrennium[] = [];

    if (variableIds.length > 0) {
      [variableGoals, variableQuadrenniums] = await Promise.all([
        this.variableGoalRepo.find({
          where: { variableId: In(variableIds), year },
        }),
        this.variableQuadrenniumRepo.find({
          where: { variableId: In(variableIds) },
        }),
      ]);
    }

    const variables = variableRelations.map((vr) => {
      const v = vr.variable;
      return {
        id: v.id,
        code: v.code,
        name: v.name,
        goals: variableGoals.filter((g) => g.variableId === v.id),
        quadrenniums: variableQuadrenniums.filter((q) => q.variableId === v.id),
      };
    });

    return {
      indicator: {
        ...indicator,
        goals: indicatorGoals,
        quadrenniums: indicatorQuadrenniums,
      },
      variables,
    };
  }

  private async getIndicativePlanData(indicatorId: string, year: number) {
    const indicator = await this.indicativeIndicatorRepo.findOne({
      where: { id: indicatorId },
      relations: [
        'unitMeasure',
        'indicatorType',
        'direction',
        'formulas'
      ],
    });

    if (!indicator) {
      throw new NotFoundException({
        message: `Indicative Plan Indicator with ID ${indicatorId} not found`,
        code: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
      });
    }

    const [indicatorGoals, indicatorQuadrenniums] = await Promise.all([
      this.indicativeIndicatorRepo.manager.find(IndicativePlanIndicatorGoal, {
        where: { indicatorId, year },
      }),
      this.indicativeIndicatorRepo.manager.find(
        IndicativePlanIndicatorQuadrennium,
        { where: { indicatorId } },
      ),
    ]);

    const variableRelations = await this.variableIndicativeRelationRepo.find({
      where: { indicatorId },
      relations: ['variable'],
    });

    const variableIds = variableRelations.map((vr) => vr.variableId);

    let variableGoals: VariableGoal[] = [];
    let variableQuadrenniums: VariableQuadrennium[] = [];

    if (variableIds.length > 0) {
      [variableGoals, variableQuadrenniums] = await Promise.all([
        this.variableGoalRepo.find({
          where: { variableId: In(variableIds), year },
        }),
        this.variableQuadrenniumRepo.find({
          where: { variableId: In(variableIds) },
        }),
      ]);
    }

    const variables = variableRelations.map((vr) => {
      const v = vr.variable;
      return {
        id: v.id,
        code: v.code,
        name: v.name,
        goals: variableGoals.filter((g) => g.variableId === v.id),
        quadrenniums: variableQuadrenniums.filter((q) => q.variableId === v.id),
      };
    });

    return {
      indicator: {
        ...indicator,
        goals: indicatorGoals,
        quadrenniums: indicatorQuadrenniums,
      },
      variables,
    };
  }
}
