import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActionPlanIndicatorsService } from "../../masters/indicators/services/action-plan/action-plan-indicators.service";
import { IndicativePlanIndicatorsService } from "../../masters/indicators/services/indicative-plan/indicative-plan-indicators.service";
import { VariablesService } from "../../masters/variables/services/variables.service";
import { ActionPlanIndicatorGoal } from "../../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { ActionPlanIndicatorQuadrennium } from "../../masters/indicators/entities/action-plan/action-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicatorGoal } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { IndicativePlanIndicatorQuadrennium } from "../../masters/indicators/entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { ProjectActionIndicatorRelation } from "../../masters/indicators/entities/action-plan/project-action-indicator-relation.entity";
import { Formula } from "../../masters/indicators/entities/formula.entity";
import { VariableGoal } from "../../masters/variables/entities/variable-goal.entity";
import { VariableQuadrennium } from "../../masters/variables/entities/variable-quadrennium.entity";
import { VariableActionRelation } from "../../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { ExportResult } from "./export.types";

@Injectable()
export class IndicatorsExportBuilder {
  private readonly logger = new Logger(IndicatorsExportBuilder.name);

  constructor(
    private readonly actionPlanIndicatorsService: ActionPlanIndicatorsService,
    private readonly indicativePlanIndicatorsService: IndicativePlanIndicatorsService,
    private readonly variablesService: VariablesService,
    @InjectRepository(ActionPlanIndicatorGoal)
    private readonly actionPlanIndicatorGoalRepository: Repository<ActionPlanIndicatorGoal>,
    @InjectRepository(ActionPlanIndicatorQuadrennium)
    private readonly actionPlanIndicatorQuadrenniumRepository: Repository<ActionPlanIndicatorQuadrennium>,
    @InjectRepository(IndicativePlanIndicatorGoal)
    private readonly indicativePlanIndicatorGoalRepository: Repository<IndicativePlanIndicatorGoal>,
    @InjectRepository(IndicativePlanIndicatorQuadrennium)
    private readonly indicativePlanIndicatorQuadrenniumRepository: Repository<IndicativePlanIndicatorQuadrennium>,
    @InjectRepository(ProjectActionIndicatorRelation)
    private readonly projectActionIndicatorRelationRepository: Repository<ProjectActionIndicatorRelation>,
    @InjectRepository(Formula)
    private readonly formulaRepository: Repository<Formula>,
    @InjectRepository(VariableGoal)
    private readonly variableGoalRepository: Repository<VariableGoal>,
    @InjectRepository(VariableQuadrennium)
    private readonly variableQuadrenniumRepository: Repository<VariableQuadrennium>,
    @InjectRepository(VariableActionRelation)
    private readonly variableActionRelationRepository: Repository<VariableActionRelation>,
    @InjectRepository(VariableIndicativeRelation)
    private readonly variableIndicativeRelationRepository: Repository<VariableIndicativeRelation>,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Indicators Export (Action Plan + Indicative Plan)                  */
  /* ------------------------------------------------------------------ */

  async buildIndicatorsExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Indicadores");

    const search = filters?.search;

    // 1. Indicadores del Plan de Acción
    const actionResult = await this.actionPlanIndicatorsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const actionData = actionResult.data.map((row: any) => ({
      code: row.code ?? "",
      statisticalCode: row.statisticalCode ?? "",
      name: row.name ?? "",
      sequenceNumber: row.sequenceNumber ?? "",
      description: row.description ?? "",
      plannedQuantity: row.plannedQuantity ? Number(row.plannedQuantity) : 0,
      executionCut: row.executionCut ? Number(row.executionCut) : 0,
      compliancePercentage: row.compliancePercentage ? Number(row.compliancePercentage) : 0,
      observations: row.observations ?? "",
      unitMeasure: row.unitMeasure?.name ?? "",
    }));

    // 2. Indicadores del Plan Indicativo
    const indicativeResult = await this.indicativePlanIndicatorsService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const indicativeData = indicativeResult.data.map((row: any) => ({
      pillarCode: row.pillarCode ?? "",
      pillarName: row.pillarName ?? "",
      componentCode: row.componentCode ?? "",
      componentName: row.componentName ?? "",
      programCode: row.programCode ?? "",
      programName: row.programName ?? "",
      code: row.code ?? "",
      name: row.name ?? "",
      description: row.description ?? "",
      baseline: row.baseline ?? "",
      observations: row.observations ?? "",
      advancePercentage: row.advancePercentage ? Number(row.advancePercentage) : 0,
      indicatorType: row.indicatorType?.name ?? "",
      unitMeasure: row.unitMeasure?.name ?? "",
      direction: row.direction?.name ?? "",
    }));

    // 3. Metas Anuales - Plan de Acción
    const actionGoals = await this.actionPlanIndicatorGoalRepository
      .createQueryBuilder("g")
      .leftJoin("g.indicator", "ind")
      .select([
        "g.id",
        "g.year",
        "g.value",
        "ind.code",
        "ind.name",
      ])
      .orderBy("ind.code", "ASC")
      .addOrderBy("g.year", "ASC")
      .getMany();

    const actionGoalsData = actionGoals.map((row: any) => ({
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
      year: row.year ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 4. Cuatrienios - Plan de Acción
    const actionQuadrenniums = await this.actionPlanIndicatorQuadrenniumRepository
      .createQueryBuilder("q")
      .leftJoin("q.indicator", "ind")
      .select([
        "q.id",
        "q.startYear",
        "q.endYear",
        "q.value",
        "ind.code",
        "ind.name",
      ])
      .orderBy("ind.code", "ASC")
      .addOrderBy("q.startYear", "ASC")
      .getMany();

    const actionQuadrenniumsData = actionQuadrenniums.map((row: any) => ({
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
      startYear: row.startYear ?? "",
      endYear: row.endYear ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 5. Metas Anuales - Plan Indicativo
    const indicativeGoals = await this.indicativePlanIndicatorGoalRepository
      .createQueryBuilder("g")
      .leftJoin("g.indicator", "ind")
      .select([
        "g.id",
        "g.year",
        "g.value",
        "ind.code",
        "ind.name",
      ])
      .orderBy("ind.code", "ASC")
      .addOrderBy("g.year", "ASC")
      .getMany();

    const indicativeGoalsData = indicativeGoals.map((row: any) => ({
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
      year: row.year ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 6. Cuatrienios - Plan Indicativo
    const indicativeQuadrenniums = await this.indicativePlanIndicatorQuadrenniumRepository
      .createQueryBuilder("q")
      .leftJoin("q.indicator", "ind")
      .select([
        "q.id",
        "q.startYear",
        "q.endYear",
        "q.value",
        "ind.code",
        "ind.name",
      ])
      .orderBy("ind.code", "ASC")
      .addOrderBy("q.startYear", "ASC")
      .getMany();

    const indicativeQuadrenniumsData = indicativeQuadrenniums.map((row: any) => ({
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
      startYear: row.startYear ?? "",
      endYear: row.endYear ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 7. Fórmulas
    const formulas = await this.formulaRepository
      .createQueryBuilder("f")
      .leftJoin("f.actionIndicator", "ai")
      .leftJoin("f.indicativeIndicator", "ii")
      .select([
        "f.id",
        "f.expression",
        "ai.code",
        "ai.name",
        "ii.code",
        "ii.name",
      ])
      .orderBy("f.id", "ASC")
      .getMany();

    const formulasData = formulas.map((row: any) => ({
      formula: row.expression ?? "",
      actionIndicatorCode: row.actionIndicator?.code ?? "",
      actionIndicatorName: row.actionIndicator?.name ?? "",
      indicativeIndicatorCode: row.indicativeIndicator?.code ?? "",
      indicativeIndicatorName: row.indicativeIndicator?.name ?? "",
    }));

    // 8. Proyectos relacionados a indicadores Plan de Acción
    const projectRelations = await this.projectActionIndicatorRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.indicator", "ind")
      .leftJoin("rel.project", "project")
      .select([
        "rel.id",
        "ind.code",
        "ind.name",
        "project.code",
        "project.name",
      ])
      .orderBy("ind.code", "ASC")
      .addOrderBy("project.code", "ASC")
      .getMany();

    const projectRelationsData = projectRelations.map((row: any) => ({
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
      projectCode: row.project?.code ?? "",
      projectName: row.project?.name ?? "",
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `indicadores-${now}.xlsx`,
      sheets: [
        {
          name: "Plan de Acción",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Código Estadístico", key: "statisticalCode", width: 20 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "N° Secuencia", key: "sequenceNumber", width: 15 },
            { header: "Descripción", key: "description", width: 45 },
            { header: "Cantidad Planeada", key: "plannedQuantity", width: 20, numFmt: "#,##0.00" },
            { header: "Corte Ejecución", key: "executionCut", width: 18, numFmt: "#,##0.00" },
            { header: "% Cumplimiento", key: "compliancePercentage", width: 18, numFmt: "#,##0.00" },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "Unidad Medida", key: "unitMeasure", width: 20 },
          ],
          data: actionData,
        },
        {
          name: "Plan Indicativo",
          columns: [
            { header: "Código Pilar", key: "pillarCode", width: 15 },
            { header: "Pilar", key: "pillarName", width: 30 },
            { header: "Código Componente", key: "componentCode", width: 18 },
            { header: "Componente", key: "componentName", width: 30 },
            { header: "Código Programa", key: "programCode", width: 18 },
            { header: "Programa", key: "programName", width: 30 },
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Descripción", key: "description", width: 45 },
            { header: "Línea Base", key: "baseline", width: 18 },
            { header: "Observaciones", key: "observations", width: 35 },
            { header: "% Avance", key: "advancePercentage", width: 15, numFmt: "#,##0.00" },
            { header: "Tipo Indicador", key: "indicatorType", width: 20 },
            { header: "Unidad Medida", key: "unitMeasure", width: 20 },
            { header: "Dirección", key: "direction", width: 18 },
          ],
          data: indicativeData,
        },
        {
          name: "Metas Plan Acción",
          columns: [
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
            { header: "Año", key: "year", width: 10 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: actionGoalsData,
        },
        {
          name: "Cuatrienios Plan Acción",
          columns: [
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
            { header: "Año Inicio", key: "startYear", width: 12 },
            { header: "Año Fin", key: "endYear", width: 12 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: actionQuadrenniumsData,
        },
        {
          name: "Metas Plan Indicativo",
          columns: [
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
            { header: "Año", key: "year", width: 10 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: indicativeGoalsData,
        },
        {
          name: "Cuatrienios Plan Indicativo",
          columns: [
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
            { header: "Año Inicio", key: "startYear", width: 12 },
            { header: "Año Fin", key: "endYear", width: 12 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: indicativeQuadrenniumsData,
        },
        {
          name: "Fórmulas",
          columns: [
            { header: "Fórmula", key: "formula", width: 50 },
            { header: "Ind. Plan Acción (Código)", key: "actionIndicatorCode", width: 22 },
            { header: "Ind. Plan Acción (Nombre)", key: "actionIndicatorName", width: 35 },
            { header: "Ind. Plan Indicativo (Código)", key: "indicativeIndicatorCode", width: 25 },
            { header: "Ind. Plan Indicativo (Nombre)", key: "indicativeIndicatorName", width: 35 },
          ],
          data: formulasData,
        },
        {
          name: "Proyectos Relacionados",
          columns: [
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
            { header: "Proyecto (Código)", key: "projectCode", width: 18 },
            { header: "Proyecto (Nombre)", key: "projectName", width: 40 },
          ],
          data: projectRelationsData,
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Variables Export                                                    */
  /* ------------------------------------------------------------------ */

  async buildVariablesExport(
    filters?: Record<string, any>,
  ): Promise<ExportResult> {
    this.logger.log("Preparando datos de exportación: Variables");

    const search = filters?.search;

    // 1. Variables (tabla principal)
    const result = await this.variablesService.findAllPaginated(
      1,
      Number.MAX_SAFE_INTEGER,
      search,
      "code",
      "ASC",
    );

    const data = result.data.map((row: any) => ({
      code: row.code ?? "",
      name: row.name ?? "",
      observations: row.observations ?? "",
    }));

    // 2. Metas Anuales de Variables
    const goals = await this.variableGoalRepository
      .createQueryBuilder("g")
      .leftJoin("g.variable", "v")
      .select([
        "g.id",
        "g.year",
        "g.value",
        "v.code",
        "v.name",
      ])
      .orderBy("v.code", "ASC")
      .addOrderBy("g.year", "ASC")
      .getMany();

    const goalsData = goals.map((row: any) => ({
      variableCode: row.variable?.code ?? "",
      variableName: row.variable?.name ?? "",
      year: row.year ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 3. Cuatrienios de Variables
    const quadrenniums = await this.variableQuadrenniumRepository
      .createQueryBuilder("q")
      .leftJoin("q.variable", "v")
      .select([
        "q.id",
        "q.startYear",
        "q.endYear",
        "q.value",
        "v.code",
        "v.name",
      ])
      .orderBy("v.code", "ASC")
      .addOrderBy("q.startYear", "ASC")
      .getMany();

    const quadrenniumsData = quadrenniums.map((row: any) => ({
      variableCode: row.variable?.code ?? "",
      variableName: row.variable?.name ?? "",
      startYear: row.startYear ?? "",
      endYear: row.endYear ?? "",
      value: row.value ? Number(row.value) : 0,
    }));

    // 4. Indicadores Plan de Acción relacionados
    const actionRelations = await this.variableActionRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.variable", "v")
      .leftJoin("rel.indicator", "ind")
      .select([
        "rel.id",
        "v.code",
        "v.name",
        "ind.code",
        "ind.name",
      ])
      .orderBy("v.code", "ASC")
      .addOrderBy("ind.code", "ASC")
      .getMany();

    const actionRelationsData = actionRelations.map((row: any) => ({
      variableCode: row.variable?.code ?? "",
      variableName: row.variable?.name ?? "",
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
    }));

    // 5. Indicadores Plan Indicativo relacionados
    const indicativeRelations = await this.variableIndicativeRelationRepository
      .createQueryBuilder("rel")
      .leftJoin("rel.variable", "v")
      .leftJoin("rel.indicator", "ind")
      .select([
        "rel.id",
        "v.code",
        "v.name",
        "ind.code",
        "ind.name",
      ])
      .orderBy("v.code", "ASC")
      .addOrderBy("ind.code", "ASC")
      .getMany();

    const indicativeRelationsData = indicativeRelations.map((row: any) => ({
      variableCode: row.variable?.code ?? "",
      variableName: row.variable?.name ?? "",
      indicatorCode: row.indicator?.code ?? "",
      indicatorName: row.indicator?.name ?? "",
    }));

    const now = new Date().toISOString().slice(0, 10);

    return {
      fileName: `variables-${now}.xlsx`,
      sheets: [
        {
          name: "Variables",
          columns: [
            { header: "Código", key: "code", width: 18 },
            { header: "Nombre", key: "name", width: 40 },
            { header: "Observaciones", key: "observations", width: 50 },
          ],
          data,
        },
        {
          name: "Metas Anuales",
          columns: [
            { header: "Variable (Código)", key: "variableCode", width: 18 },
            { header: "Variable (Nombre)", key: "variableName", width: 40 },
            { header: "Año", key: "year", width: 10 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: goalsData,
        },
        {
          name: "Cuatrienios",
          columns: [
            { header: "Variable (Código)", key: "variableCode", width: 18 },
            { header: "Variable (Nombre)", key: "variableName", width: 40 },
            { header: "Año Inicio", key: "startYear", width: 12 },
            { header: "Año Fin", key: "endYear", width: 12 },
            { header: "Valor", key: "value", width: 20, numFmt: "#,##0.00" },
          ],
          data: quadrenniumsData,
        },
        {
          name: "Ind. Plan Acción",
          columns: [
            { header: "Variable (Código)", key: "variableCode", width: 18 },
            { header: "Variable (Nombre)", key: "variableName", width: 40 },
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
          ],
          data: actionRelationsData,
        },
        {
          name: "Ind. Plan Indicativo",
          columns: [
            { header: "Variable (Código)", key: "variableCode", width: 18 },
            { header: "Variable (Nombre)", key: "variableName", width: 40 },
            { header: "Indicador (Código)", key: "indicatorCode", width: 18 },
            { header: "Indicador (Nombre)", key: "indicatorName", width: 40 },
          ],
          data: indicativeRelationsData,
        },
      ],
    };
  }
}
