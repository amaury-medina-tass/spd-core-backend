import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";
import { Rubric } from "../../rubrics/entities/rubric.entity";

export enum ModificationType {
    ADDITION = "ADDITION", // ADICION
    REDUCTION = "REDUCTION", // REDUCCION
    TRANSFER = "TRANSFER", // TRASLADO
    RECLASSIFICATION = "RECLASSIFICATION" // RECLASIFICACION
}

@Entity({ name: "budget_modifications" })
export class BudgetModification {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "modification_type", type: "text" })
    modificationType!: ModificationType;

    @Column({ name: "legal_document", type: "text", nullable: true })
    legalDocument?: string;

    @Column({ name: "date_issue", type: "timestamp", default: () => "now()" })
    dateIssue!: Date;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    value!: number;

    // Snapshot Financiero
    @Column({ name: "previous_balance", type: "numeric", precision: 18, scale: 2 })
    previousBalance!: number;

    @Column({ name: "new_balance", type: "numeric", precision: 18, scale: 2 })
    newBalance!: number;

    // Snapshot Clasificación (Rubro)
    @ManyToOne(() => Rubric, { nullable: true })
    @JoinColumn({ name: "previous_rubric_id" })
    previousRubric?: Rubric;

    @Column({ name: "previous_rubric_id", nullable: true })
    previousRubricId?: string;

    @ManyToOne(() => Rubric, { nullable: true })
    @JoinColumn({ name: "new_rubric_id" })
    newRubric?: Rubric;

    @Column({ name: "new_rubric_id", nullable: true })
    newRubricId?: string;

    @ManyToOne(() => DetailedActivity)
    @JoinColumn({ name: "detailed_activity_id" })
    detailedActivity!: DetailedActivity;

    @Column({ name: "detailed_activity_id" })
    detailedActivityId!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "now()" })
    createdAt!: Date;
}
