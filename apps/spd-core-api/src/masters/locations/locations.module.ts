import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Commune } from "./entities/commune.entity";
import { Location } from "./entities/location.entity";
import { CommunesService } from "./services/communes.service";
import { LocationsService } from "./services/locations.service";
import { CommunesController } from "./controllers/communes.controller";
import { LocationsController } from "./controllers/locations.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Commune, Location]),
    ],
    controllers: [CommunesController, LocationsController],
    providers: [CommunesService, LocationsService],
    exports: [CommunesService, LocationsService, TypeOrmModule],
})
export class LocationsModule { }
