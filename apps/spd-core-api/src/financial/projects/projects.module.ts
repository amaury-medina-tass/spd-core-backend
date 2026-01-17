import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entities/project.entity";
import { ProjectsController } from "./controllers/projects.controller";
import { ProjectsService } from "./services/projects.service";

import { DependenciesModule } from "../../financial/dependencies/dependencies.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Project]),
        DependenciesModule
    ],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule { }
