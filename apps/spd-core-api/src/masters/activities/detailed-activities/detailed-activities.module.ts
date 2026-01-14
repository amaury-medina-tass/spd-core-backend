import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DetailedActivity } from "./detailed-activity.entity";
import { DetailedActivitiesService } from "./services/detailed-activities.service";
import { DetailedActivitiesController } from "./controllers/detailed-activities.controller";

@Module({
  imports: [TypeOrmModule.forFeature([DetailedActivity])],
  providers: [DetailedActivitiesService],
  controllers: [DetailedActivitiesController],
  exports: [DetailedActivitiesService],
})
export class DetailedActivitiesModule {}
