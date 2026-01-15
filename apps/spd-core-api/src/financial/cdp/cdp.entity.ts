import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DetailedActivity } from "../../masters/activities/detailed-activities/detailed-activity.entity";

@Entity({ name: "cdps" })
export class Cdp {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  number!: string;

  @ManyToOne(() => DetailedActivity, (a) => a.cdps, { eager: true, onDelete: "RESTRICT" })
  activity!: DetailedActivity;

  @Column({ type: "numeric", default: 0 })
  value!: number;

  // Ajuste sobre la actividad (según tu dominio)
  @Column({ type: "numeric", default: 0 })
  activity_delta!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
