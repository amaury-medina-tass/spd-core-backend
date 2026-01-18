import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetModification } from "./entities/budget-modification.entity";
import { BudgetModificationsService } from "./services/budget-modifications.service";
import { BudgetModificationsController } from "./controllers/budget-modifications.controller";
import { DetailedActivity } from "../detailed-activities/entities/detailed-activity.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([BudgetModification, DetailedActivity]),
    ],
    controllers: [BudgetModificationsController],
    providers: [BudgetModificationsService],
    exports: [BudgetModificationsService],
})
export class BudgetModificationsModule { }
