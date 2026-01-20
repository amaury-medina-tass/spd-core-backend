import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MgaActivity } from "./entities/mga-activity.entity";
import { MgaDetailedRelation } from "./entities/mga-detailed-relation.entity";
import { MgaActivitiesService } from "./services/mga-activities.service";
import { MgaActivitiesController } from "./controllers/mga-activities.controller";

import { DetailedActivity } from "../detailed-activities/entities/detailed-activity.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([MgaActivity, MgaDetailedRelation, DetailedActivity]),
    ],
    controllers: [MgaActivitiesController],
    providers: [MgaActivitiesService],
    exports: [MgaActivitiesService],
})
export class MgaActivitiesModule { }
