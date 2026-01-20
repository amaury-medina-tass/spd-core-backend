import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FundingSource } from "./entities/funding-source.entity";
import { FundingSourcesController } from "./controllers/funding-sources.controller";
import { FundingSourcesService } from "./services/funding-sources.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([FundingSource]),
    ],
    controllers: [FundingSourcesController],
    providers: [FundingSourcesService],
    exports: [FundingSourcesService],
})
export class FundingSourcesModule { }
