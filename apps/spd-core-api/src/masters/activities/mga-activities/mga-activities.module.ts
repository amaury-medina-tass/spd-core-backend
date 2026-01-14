import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MgaActivity } from "./mga-activity.entity";
import { MgaActivitiesService } from "./services/mga-activities.service";
import { MgaActivitiesController } from "./controllers/mga-activities.controller";

@Module({
  imports: [TypeOrmModule.forFeature([MgaActivity])],
  providers: [MgaActivitiesService],
  controllers: [MgaActivitiesController],
  exports: [MgaActivitiesService],
})
export class MgaActivitiesModule {}
