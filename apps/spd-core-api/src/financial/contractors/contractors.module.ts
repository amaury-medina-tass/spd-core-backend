import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Contractor } from "./entities/contractor.entity";
import { ContractorsController } from "./controllers/contractors.controller";
import { ContractorsService } from "./services/contractors.service";

@Module({
    imports: [TypeOrmModule.forFeature([Contractor])],
    controllers: [ContractorsController],
    providers: [ContractorsService],
    exports: [ContractorsService],
})
export class ContractorsModule { }
