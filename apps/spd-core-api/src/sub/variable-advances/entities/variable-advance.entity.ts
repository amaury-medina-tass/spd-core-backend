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
import { Variable } from "../../../masters/variables/entities/variable.entity";

@Entity({ name: "variable_advances" })
@Index(["variable", "year", "month"], { unique: true })
export class VariableAdvance {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "variable_id" })
    variableId!: string;

    @Column({ type: "integer" })
    year!: number;

    @Column({ type: "integer" })
    month!: number;

    @Column({ type: "numeric", precision: 18, scale: 2 })
    value!: number;

    @Column({ type: "text", nullable: true })
    observations?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
