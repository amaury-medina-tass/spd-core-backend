import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxService } from "./outbox.service";
import { OutboxMessage } from "@common/entities/outbox-message.entity";

@Module({
  imports: [TypeOrmModule.forFeature([OutboxMessage])],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
