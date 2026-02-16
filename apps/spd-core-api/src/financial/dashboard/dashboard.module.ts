import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./controllers/dashboard.controller";
import { DashboardService } from "./services/dashboard.service";
import { Need } from "../needs/entities/need.entity";
import { Cdp } from "../cdps/entities/cdp.entity";
import { CdpPosition } from "../cdps/entities/cdp-position.entity";
import { CdpPositionFunding } from "../cdps/entities/cdp-position-funding.entity";
import { CdpProject } from "../cdps/entities/cdp-project.entity";
import { MasterContract } from "../master-contracts/entities/master-contract.entity";
import { ContractCdpRelation } from "../contract-cdp-relations/entities/contract-cdp-relation.entity";
import { BudgetRecord } from "../budget-records/entities/budget-record.entity";
import { Project } from "../projects/entities/project.entity";
import { DetailedActivity } from "../../masters/detailed-activities/entities/detailed-activity.entity";
import { MgaActivity } from "../../masters/mga-activities/entities/mga-activity.entity";
import { MgaDetailedRelation } from "../../masters/mga-activities/entities/mga-detailed-relation.entity";
import { BudgetModification } from "../../masters/budget-modifications/entities/budget-modification.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Need,
            Cdp,
            CdpPosition,
            CdpPositionFunding,
            CdpProject,
            MasterContract,
            ContractCdpRelation,
            BudgetRecord,
            Project,
            DetailedActivity,
            MgaActivity,
            MgaDetailedRelation,
            BudgetModification,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}
