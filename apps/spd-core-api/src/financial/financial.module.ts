import { Module } from "@nestjs/common";
import { CdpModule } from "./cdp/cdp.module";

@Module({
  imports: [CdpModule],
})
export class FinancialModule { }
