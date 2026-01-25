import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Variable } from "./entities/variable.entity";
import { VariableGoal } from "./entities/variable-goal.entity";
import { VariablesService } from "./services/variables.service";
import { VariableGoalsService } from "./services/variable-goals.service";
import { VariablesController } from "./controllers/variables.controller";
import { VariableGoalsController } from "./controllers/variable-goals.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Variable, VariableGoal]),
    ],
    controllers: [VariablesController, VariableGoalsController],
    providers: [VariablesService, VariableGoalsService],
    exports: [VariablesService, VariableGoalsService],
})
export class VariablesModule { }

