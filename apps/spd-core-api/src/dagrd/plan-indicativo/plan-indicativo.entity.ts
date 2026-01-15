import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MgaActivity } from "../../masters/activities/mga-activities/mga-activity.entity";

@Entity({ name: "dagrd_plan_indicativos" })
export class PlanIndicativo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => MgaActivity, { eager: true, onDelete: "RESTRICT" })
  activity!: MgaActivity;

  @Column({ type: "varchar", length: 200 })
  component!: string;

  @Column({ type: "numeric", default: 0 })
  target!: number;

  @Column({ type: "numeric", default: 0 })
  advance!: number;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
