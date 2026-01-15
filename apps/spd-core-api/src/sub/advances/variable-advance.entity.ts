import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Variable } from "../../masters/variables/variable.entity";

@Entity({ name: "variable_advances" })
export class VariableAdvance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Variable, { eager: true, onDelete: "RESTRICT" })
  variable!: Variable;

  @Column({ type: "numeric", default: 0 })
  value!: number;

  @Column({ type: "varchar", length: 50, default: "month" })
  period_type!: string;

  @Column({ type: "varchar", length: 20 })
  period_key!: string;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
