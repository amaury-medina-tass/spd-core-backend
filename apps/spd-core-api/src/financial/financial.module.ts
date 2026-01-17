import { Module } from "@nestjs/common";
import { CdpModule } from "./cdp/cdp.module";
import { ProjectsModule } from "./projects/projects.module";
import { NeedsModule } from "./needs/needs.module";
import { MasterContractsModule } from "./master-contracts/master-contracts.module";
import { DependenciesModule } from "./dependencies/dependencies.module";
import { ContractorsModule } from "./contractors/contractors.module";

@Module({
  imports: [
    CdpModule,
    ProjectsModule,
    NeedsModule,
    MasterContractsModule,
    DependenciesModule,
    ContractorsModule,
  ],
})
export class FinancialModule { }
