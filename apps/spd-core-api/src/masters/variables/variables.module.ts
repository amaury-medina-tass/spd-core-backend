import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Variable } from "./entities/variable.entity";
import { VariableGoal } from "./entities/variable-goal.entity";
import { VariableQuadrennium } from "./entities/variable-quadrennium.entity";
import { VariableLocation } from "./entities/variable-location.entity";
import { VariablesService } from "./services/variables.service";
import { VariableGoalsService } from "./services/variable-goals.service";
import { VariableQuadrenniumsService } from "./services/variable-quadrenniums.service";
import { VariableLocationsService } from "./services/variable-locations.service";
import { VariablesController } from "./controllers/variables.controller";
import { VariableGoalsController } from "./controllers/variable-goals.controller";
import { VariableQuadrenniumsController } from "./controllers/variable-quadrenniums.controller";
import { VariableLocationsController } from "./controllers/variable-locations.controller";
import { LocationsModule } from "../locations/locations.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Variable, VariableGoal, VariableQuadrennium, VariableLocation]),
        LocationsModule,
    ],
    controllers: [VariablesController, VariableGoalsController, VariableQuadrenniumsController, VariableLocationsController],
    providers: [VariablesService, VariableGoalsService, VariableQuadrenniumsService, VariableLocationsService],
    exports: [VariablesService, VariableGoalsService, VariableQuadrenniumsService, VariableLocationsService],
})
export class VariablesModule { }
