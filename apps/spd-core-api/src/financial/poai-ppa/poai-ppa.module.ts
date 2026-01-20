import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PoaiPpa } from "./entities/poai-ppa.entity";
import { PoaiPpaController } from "./controllers/poai-ppa.controller";
import { PoaiPpaService } from "./services/poai-ppa.service";
import { ProjectsModule } from "../projects/projects.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([PoaiPpa]),
        ProjectsModule
    ],
    controllers: [PoaiPpaController],
    providers: [PoaiPpaService],
    exports: [PoaiPpaService],
})
export class PoaiPpaModule { }
