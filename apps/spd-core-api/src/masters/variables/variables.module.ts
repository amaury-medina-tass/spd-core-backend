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
import { VariableUser } from "./entities/variable-user.entity";
import { VariableUsersService } from "./services/variable-users.service";
import { VariableUsersController } from "./controllers/variable-users.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Variable, VariableGoal, VariableQuadrennium, VariableLocation, VariableUser]),
        LocationsModule,
    ],
    controllers: [VariablesController, VariableGoalsController, VariableQuadrenniumsController, VariableLocationsController, VariableUsersController],
    providers: [VariablesService, VariableGoalsService, VariableQuadrenniumsService, VariableLocationsService, VariableUsersService],
    exports: [VariablesService, VariableGoalsService, VariableQuadrenniumsService, VariableLocationsService, VariableUsersService],
})
export class VariablesModule { }
