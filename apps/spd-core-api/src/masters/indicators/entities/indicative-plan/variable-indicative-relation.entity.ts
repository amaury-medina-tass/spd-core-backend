import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Variable } from "../../../variables/entities/variable.entity";
import { IndicativePlanIndicator } from "./indicative-plan-indicator.entity";

@Entity({ name: "variable_indicative_relations" })
@Index(["variableId", "indicatorId"], { unique: true })
export class VariableIndicativeRelation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "variable_id", type: "uuid" })
    variableId!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "indicator_id", type: "uuid" })
    indicatorId!: string;

    @ManyToOne(() => IndicativePlanIndicator)
    @JoinColumn({ name: "indicator_id" })
    indicator!: IndicativePlanIndicator;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
