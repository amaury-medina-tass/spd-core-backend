import { Module } from "@nestjs/common";
import { AdvancesModule } from "./advances/advances.module";

@Module({
  imports: [AdvancesModule],
})
export class SubModule {}
