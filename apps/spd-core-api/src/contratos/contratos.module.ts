import { Module } from "@nestjs/common";
import { ContratosMarcoModule } from "./contratos-marco/contratos-marco.module";

@Module({
  imports: [ContratosMarcoModule],
})
export class ContratosModule {}
