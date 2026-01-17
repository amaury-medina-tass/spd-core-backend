import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Need } from "./entities/need.entity";
import { NeedsService } from "./services/needs.service";
import { NeedsController } from "./controllers/needs.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Need])],
    controllers: [NeedsController],
    providers: [NeedsService],
    exports: [NeedsService],
})
export class NeedsModule { }
