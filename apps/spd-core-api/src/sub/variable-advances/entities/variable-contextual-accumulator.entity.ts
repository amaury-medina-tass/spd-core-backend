import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Check,
} from "typeorm";
import { VariableIndicativeRelation } from "../../../masters/indicators/entities/indicative-plan/variable-indicative-relation.entity";
import { VariableActionRelation } from "../../../masters/indicators/entities/action-plan/variable-action-relation.entity";

@Entity({ name: "variable_contextual_accumulators" })
@Check(
    `("indicative_relation_id" IS NOT NULL AND "action_relation_id" IS NULL) OR ("indicative_relation_id" IS NULL AND "action_relation_id" IS NOT NULL)`
)
export class VariableContextualAccumulator {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "indicative_relation_id", type: "uuid", nullable: true })
    indicativeRelationId?: string;

    @ManyToOne(() => VariableIndicativeRelation)
    @JoinColumn({ name: "indicative_relation_id" })
    indicativeRelation?: VariableIndicativeRelation;

    @Column({ name: "action_relation_id", type: "uuid", nullable: true })
    actionRelationId?: string;

    @ManyToOne(() => VariableActionRelation)
    @JoinColumn({ name: "action_relation_id" })
    actionRelation?: VariableActionRelation;

    @Column({ name: "calculated_value", type: "numeric", precision: 18, scale: 2 })
    calculatedValue!: number;

    @UpdateDateColumn({ name: "last_calculation_date", type: "timestamp", default: () => "now()" })
    lastCalculationDate!: Date;

    // Optional: Create date if needed, though not specified in user request for this specific table, 
    // but good practice. User script had `last_calculation_date` default now().
}
