import { Module } from "@nestjs/common";
import { ProjectsModule } from "./projects/projects.module";
import { NeedsModule } from "./needs/needs.module";
import { MasterContractsModule } from "./master-contracts/master-contracts.module";
import { DependenciesModule } from "./dependencies/dependencies.module";
import { ContractorsModule } from "./contractors/contractors.module";
import { PreviousStudiesModule } from "./previous-studies/previous-studies.module";
import { PoaiPpaModule } from "./poai-ppa/poai-ppa.module";
import { CdpsModule } from "./cdps/cdps.module";
import { ContractCdpRelationsModule } from "./contract-cdp-relations/contract-cdp-relations.module";
import { FundingSourcesModule } from "./funding-sources/funding-sources.module";
import { BudgetRecordsModule } from "./budget-records/budget-records.module";
import { ContractPositionsModule } from "./contract-positions/contract-positions.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    ProjectsModule,
    NeedsModule,
    MasterContractsModule,
    DependenciesModule,
    ContractorsModule,
    PreviousStudiesModule,
    PoaiPpaModule,
    CdpsModule,
    ContractCdpRelationsModule,
    FundingSourcesModule,
    BudgetRecordsModule,
    ContractPositionsModule,
    DashboardModule,
  ],
})
export class FinancialModule { }


