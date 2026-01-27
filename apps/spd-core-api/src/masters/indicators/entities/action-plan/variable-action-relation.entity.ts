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
import { ActionPlanIndicator } from "./action-plan-indicator.entity";

@Entity({ name: "variable_action_relations" })
@Index(["variableId", "indicatorId"], { unique: true })
export class VariableActionRelation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "variable_id", type: "uuid" })
    variableId!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "indicator_id", type: "uuid" })
    indicatorId!: string;

    @ManyToOne(() => ActionPlanIndicator)
    @JoinColumn({ name: "indicator_id" })
    indicator!: ActionPlanIndicator;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
