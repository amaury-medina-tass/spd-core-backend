import { Module } from "@nestjs/common";
import { ProjectsModule } from "./projects/projects.module";
import { NeedsModule } from "./needs/needs.module";
import { MasterContractsModule } from "./master-contracts/master-contracts.module";
import { DependenciesModule } from "./dependencies/dependencies.module";
import { ContractorsModule } from "./contractors/contractors.module";
import { PreviousStudiesModule } from "./previous-studies/previous-studies.module";

@Module({
  imports: [
    ProjectsModule,
    NeedsModule,
    MasterContractsModule,
    DependenciesModule,
    ContractorsModule,
    PreviousStudiesModule,
  ],
})
export class FinancialModule { }
