import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VariableAdvance } from "./variable-advance.entity";
import { Variable } from "../../masters/variables/variable.entity";
import { AdvancesService } from "./services/advances.service";
import { AdvancesController } from "./controllers/advances.controller";
import { OutboxModule } from "../../outbox/outbox.module";

@Module({
  imports: [TypeOrmModule.forFeature([VariableAdvance, Variable]), OutboxModule],
  providers: [AdvancesService],
  controllers: [AdvancesController],
})
export class AdvancesModule {}
