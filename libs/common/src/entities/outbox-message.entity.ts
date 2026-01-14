import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "outbox_messages" })
export class OutboxMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "jsonb" })
  payload!: Record<string, any>;

  @Column({ type: "jsonb", default: {} })
  headers!: Record<string, any>;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "text", nullable: true })
  last_error?: string;

  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;

  // Note: structured.txt uses occurred_at in `enqueue`, so we match it.
  @Column({ type: "timestamp" })
  occurred_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;
}
