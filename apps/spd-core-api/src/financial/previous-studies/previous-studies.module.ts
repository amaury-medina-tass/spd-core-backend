import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PreviousStudy } from "./entities/previous-study.entity";
import { PreviousStudiesService } from "./services/previous-studies.service";
import { PreviousStudiesController } from "./controllers/previous-studies.controller";

@Module({
    imports: [TypeOrmModule.forFeature([PreviousStudy])],
    controllers: [PreviousStudiesController],
    providers: [PreviousStudiesService],
    exports: [PreviousStudiesService],
})
export class PreviousStudiesModule { }
