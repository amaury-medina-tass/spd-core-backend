import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InternalExportsController } from "./internal-exports.controller";
import { InternalExportsService } from "./internal-exports.service";
import {
  ActivitiesExportBuilder,
  CdpExportBuilder,
  NeedsExportBuilder,
  ContractsExportBuilder,
  ProjectsExportBuilder,
  PreviousStudiesExportBuilder,
  PoaiPpaExportBuilder,
  DashboardExportBuilder,
  IndicatorsExportBuilder,
} from "./exports";
import { MgaActivitiesModule } from "../masters/mga-activities/mga-activities.module";
import { CdpsModule } from "../financial/cdps/cdps.module";
import { DetailedActivitiesModule } from "../masters/detailed-activities/detailed-activities.module";
import { ProductsModule } from "../masters/products/products.module";
import { ProjectsModule } from "../financial/projects/projects.module";
import { NeedsModule } from "../financial/needs/needs.module";
import { MasterContractsModule } from "../financial/master-contracts/master-contracts.module";
import { PreviousStudiesModule } from "../financial/previous-studies/previous-studies.module";
import { PoaiPpaModule } from "../financial/poai-ppa/poai-ppa.module";
import { IndicatorsModule } from "../masters/indicators/indicators.module";
import { VariablesModule } from "../masters/variables/variables.module";
import { DashboardModule } from "../financial/dashboard/dashboard.module";
import { MgaDetailedRelation } from "../masters/mga-activities/entities/mga-detailed-relation.entity";
import { Cdp } from "../financial/cdps/entities/cdp.entity";
import { CdpPositionFunding } from "../financial/cdps/entities/cdp-position-funding.entity";
import { ContractCdpRelation } from "../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { CdpProject } from "../financial/cdps/entities/cdp-project.entity";
import { Need } from "../financial/needs/entities/need.entity";
import { MasterContract } from "../financial/master-contracts/entities/master-contract.entity";
import { PreviousStudy } from "../financial/previous-studies/entities/previous-study.entity";
import { BudgetRecord } from "../financial/budget-records/entities/budget-record.entity";
import { ContractPosition } from "../financial/contract-positions/entities/contract-position.entity";
import { PoaiPpa } from "../financial/poai-ppa/entities/poai-ppa.entity";
import { BudgetModification } from "../masters/budget-modifications/entities/budget-modification.entity";
import { VariableGoal } from "../masters/variables/entities/variable-goal.entity";
import { VariableQuadrennium } from "../masters/variables/entities/variable-quadrennium.entity";
import { VariableActionRelation } from "../masters/indicators/entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { ActionPlanIndicatorGoal } from "../masters/indicators/entities/action-plan/action-plan-indicator-goal.entity";
import { ActionPlanIndicatorQuadrennium } from "../masters/indicators/entities/action-plan/action-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicatorGoal } from "../masters/indicators/entities/indicative-plan/indicative-plan-indicator-goal.entity";
import { IndicativePlanIndicatorQuadrennium } from "../masters/indicators/entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { ProjectActionIndicatorRelation } from "../masters/indicators/entities/action-plan/project-action-indicator-relation.entity";
import { Formula } from "../masters/indicators/entities/formula.entity";

/**
 * Módulo de endpoints internos (server-to-server).
 *
 * Importa los módulos de dominio necesarios para obtener datos
 * y los expone en rutas /internal/* sin autenticación JWT.
 *
 * Estos endpoints son consumidos por spd-files-worker para
 * obtener los datos que necesita para generar archivos de exportación.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MgaDetailedRelation, Cdp, CdpPositionFunding, ContractCdpRelation, CdpProject,
      Need, MasterContract, PreviousStudy, BudgetRecord, ContractPosition, PoaiPpa,
      BudgetModification, VariableGoal, VariableQuadrennium,
      VariableActionRelation, VariableIndicativeRelation,
      ActionPlanIndicatorGoal, ActionPlanIndicatorQuadrennium,
      IndicativePlanIndicatorGoal, IndicativePlanIndicatorQuadrennium,
      ProjectActionIndicatorRelation, Formula,
    ]),
    MgaActivitiesModule,
    CdpsModule,
    DetailedActivitiesModule,
    ProductsModule,
    ProjectsModule,
    NeedsModule,
    MasterContractsModule,
    PreviousStudiesModule,
    PoaiPpaModule,
    IndicatorsModule,
    VariablesModule,
    DashboardModule,
  ],
  controllers: [InternalExportsController],
  providers: [
    InternalExportsService,
    ActivitiesExportBuilder,
    CdpExportBuilder,
    NeedsExportBuilder,
    ContractsExportBuilder,
    ProjectsExportBuilder,
    PreviousStudiesExportBuilder,
    PoaiPpaExportBuilder,
    DashboardExportBuilder,
    IndicatorsExportBuilder,
  ],
})
export class InternalModule {}
