import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Dependency } from "./entities/dependency.entity";
import { DependenciesController } from "./controllers/dependencies.controller";
import { DependenciesService } from "./services/dependencies.service";

@Module({
    imports: [TypeOrmModule.forFeature([Dependency])],
    controllers: [DependenciesController],
    providers: [DependenciesService],
    exports: [DependenciesService],
})
export class DependenciesModule { }
