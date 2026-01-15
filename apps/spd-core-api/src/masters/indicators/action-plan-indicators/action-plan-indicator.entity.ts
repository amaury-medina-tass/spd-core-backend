import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Variable } from "../../variables/variable.entity";

@Entity({ name: "action_plan_indicators" })
export class ActionPlanIndicator {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  code!: string;

  @Column({ type: "varchar", length: 250 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  // fórmula definida en maestros (AST JSON)
  @Column({ type: "jsonb", default: {} })
  formula_ast!: Record<string, any>;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  // variables que usa este indicador
  // Warning: This shares the Variable entity but uses a new join table
  @ManyToMany(() => Variable, { eager: true })
  @JoinTable({
    name: "action_plan_indicator_variables",
    joinColumn: { name: "indicator_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "variable_id", referencedColumnName: "id" },
  })
  variables!: Variable[];

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
