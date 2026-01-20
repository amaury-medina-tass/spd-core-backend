import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContractPosition } from "./entities/contract-position.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ContractPosition]),
    ],
    exports: [TypeOrmModule],
})
export class ContractPositionsModule { }
