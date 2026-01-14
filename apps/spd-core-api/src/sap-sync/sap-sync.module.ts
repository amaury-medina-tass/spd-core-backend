import { Module } from "@nestjs/common";
import { SapSyncController } from "./sap-sync.controller";
import { SapSyncService } from "./sap-sync.service";
import { OutboxModule } from "../outbox/outbox.module";

@Module({
  imports: [OutboxModule],
  controllers: [SapSyncController],
  providers: [SapSyncService],
  exports: [SapSyncService],
})
export class SapSyncModule {}
