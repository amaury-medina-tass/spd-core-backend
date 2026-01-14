import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Variable } from "./variable.entity";
import { VariablesService } from "./services/variables.service";
import { VariablesController } from "./controllers/variables.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Variable])],
  providers: [VariablesService],
  controllers: [VariablesController],
  exports: [VariablesService],
})
export class VariablesModule {}
