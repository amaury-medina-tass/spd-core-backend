import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContratoMarco } from "./contrato-marco.entity";
import { Cdp } from "../../financiero/cdp/cdp.entity";
import { ContratosMarcoService } from "./services/contratos-marco.service";
import { ContratosMarcoController } from "./controllers/contratos-marco.controller";
import { OutboxModule } from "../../outbox/outbox.module";

@Module({
  imports: [TypeOrmModule.forFeature([ContratoMarco, Cdp]), OutboxModule],
  providers: [ContratosMarcoService],
  controllers: [ContratosMarcoController],
})
export class ContratosMarcoModule {}
