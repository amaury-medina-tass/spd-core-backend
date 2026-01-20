import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetRecord } from "./entities/budget-record.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([BudgetRecord]),
    ],
    exports: [TypeOrmModule],
})
export class BudgetRecordsModule { }
