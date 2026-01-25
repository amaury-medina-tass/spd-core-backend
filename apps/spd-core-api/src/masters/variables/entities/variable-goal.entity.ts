import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Variable } from "./variable.entity";

@Entity({ name: "variable_goals" })
@Index(["variable", "year"], { unique: true })
export class VariableGoal {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "variable_id" })
    variableId!: string;

    @Column({ type: "integer" })
    year!: number;

    @Column({ type: "numeric", precision: 18, scale: 2 })
    value!: number;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
