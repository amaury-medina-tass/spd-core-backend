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

@Entity({ name: "variable_quadrenniums" })
@Index(["variable", "startYear", "endYear"], { unique: true })
export class VariableQuadrennium {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "variable_id" })
    variableId!: string;

    @Column({ name: "start_year", type: "integer" })
    startYear!: number;

    @Column({ name: "end_year", type: "integer" })
    endYear!: number;

    @Column({ type: "numeric", precision: 18, scale: 2 })
    value!: number;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
