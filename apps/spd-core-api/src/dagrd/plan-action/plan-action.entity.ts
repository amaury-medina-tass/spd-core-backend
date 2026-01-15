import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DetailedActivity } from "../../masters/activities/detailed-activities/detailed-activity.entity";

@Entity({ name: "dagrd_plan_actions" })
export class PlanAction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => DetailedActivity, { eager: true, onDelete: "RESTRICT" })
  activity!: DetailedActivity;

  @Column({ type: "varchar", length: 200 })
  line!: string;

  @Column({ type: "numeric", default: 0 })
  target!: number;

  @Column({ type: "numeric", default: 0 })
  advance!: number;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
