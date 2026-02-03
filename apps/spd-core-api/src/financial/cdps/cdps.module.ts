import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cdp } from "./entities/cdp.entity";
import { CdpPosition } from "./entities/cdp-position.entity";
import { CdpPositionFunding } from "./entities/cdp-position-funding.entity";
import { CdpProject } from "./entities/cdp-project.entity";
import { DetailedActivity } from "../../masters/detailed-activities/entities/detailed-activity.entity";
import { BudgetRecord } from "../budget-records/entities/budget-record.entity";
import { CdpsController } from "./controllers/cdps.controller";
import { CdpPositionsController } from "./controllers/cdp-positions.controller";
import { CdpFundingController } from "./controllers/cdp-funding.controller";
import { CdpsService } from "./services/cdps.service";
import { CdpPositionsService } from "./services/cdp-positions.service";
import { CdpFundingService } from "./services/cdp-funding.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Cdp, CdpPosition, CdpPositionFunding, CdpProject, DetailedActivity, BudgetRecord]),
    ],
    controllers: [CdpsController, CdpPositionsController, CdpFundingController],
    providers: [CdpsService, CdpPositionsService, CdpFundingService],
    exports: [CdpsService, CdpPositionsService, CdpFundingService],
})
export class CdpsModule { }
