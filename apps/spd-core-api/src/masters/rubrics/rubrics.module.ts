import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rubric } from "./entities/rubric.entity";
import { RubricsService } from "./services/rubrics.service";
import { RubricsController } from "./controllers/rubrics.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Rubric]),
    ],
    controllers: [RubricsController],
    providers: [RubricsService],
    exports: [RubricsService],
})
export class RubricsModule { }
