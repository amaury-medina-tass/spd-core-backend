import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Variable } from "./entities/variable.entity";
import { VariableGoal } from "./entities/variable-goal.entity";
import { VariableQuadrennium } from "./entities/variable-quadrennium.entity";
import { VariablesService } from "./services/variables.service";
import { VariableGoalsService } from "./services/variable-goals.service";
import { VariableQuadrenniumsService } from "./services/variable-quadrenniums.service";
import { VariablesController } from "./controllers/variables.controller";
import { VariableGoalsController } from "./controllers/variable-goals.controller";
import { VariableQuadrenniumsController } from "./controllers/variable-quadrenniums.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Variable, VariableGoal, VariableQuadrennium]),
    ],
    controllers: [VariablesController, VariableGoalsController, VariableQuadrenniumsController],
    providers: [VariablesService, VariableGoalsService, VariableQuadrenniumsService],
    exports: [VariablesService, VariableGoalsService, VariableQuadrenniumsService],
})
export class VariablesModule { }

