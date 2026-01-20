import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cdp } from "./entities/cdp.entity";
import { CdpPosition } from "./entities/cdp-position.entity";
import { CdpPositionFunding } from "./entities/cdp-position-funding.entity";
import { CdpProject } from "./entities/cdp-project.entity";
import { CdpsController } from "./controllers/cdps.controller";
import { CdpPositionsController } from "./controllers/cdp-positions.controller";
import { CdpsService } from "./services/cdps.service";
import { CdpPositionsService } from "./services/cdp-positions.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Cdp, CdpPosition, CdpPositionFunding, CdpProject]),
    ],
    controllers: [CdpsController, CdpPositionsController],
    providers: [CdpsService, CdpPositionsService],
    exports: [CdpsService, CdpPositionsService],
})
export class CdpsModule { }

