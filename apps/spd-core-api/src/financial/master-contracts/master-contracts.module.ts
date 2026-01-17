import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MasterContract } from "./entities/master-contract.entity";
import { MasterContractsController } from "./controllers/master-contracts.controller";
import { MasterContractsService } from "./services/master-contracts.service";

@Module({
    imports: [TypeOrmModule.forFeature([MasterContract])],
    controllers: [MasterContractsController],
    providers: [MasterContractsService],
    exports: [MasterContractsService],
})
export class MasterContractsModule { }
