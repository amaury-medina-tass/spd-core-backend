import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContractCdpRelation } from "./entities/contract-cdp-relation.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ContractCdpRelation]),
    ],
    exports: [TypeOrmModule],
})
export class ContractCdpRelationsModule { }
