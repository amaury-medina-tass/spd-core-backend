import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UnitMeasure } from "../common/unit-measure.entity";

@Entity({ name: "action_plan_indicators" })
export class ActionPlanIndicator {
    @PrimaryGeneratedColumn("uuid", { name: "id_indicator" })
    id!: string;

    @Column({ name: "code", type: "text", nullable: true })
    code?: string;

    @Column({ name: "statistical_code", type: "text", nullable: true })
    statisticalCode?: string;

    @Column({ name: "name", type: "text", nullable: true })
    name?: string;

    @Column({ name: "sequence_number", type: "numeric", nullable: true })
    sequenceNumber?: number;

    @Column({ name: "description", type: "text" })
    description!: string;

    @Column({ name: "planned_quantity", type: "numeric", nullable: true })
    plannedQuantity?: number;

    @Column({ name: "execution_cut", type: "text", nullable: true })
    executionCut?: string;

    @Column({ name: "compliance_percentage", type: "numeric", default: 0, nullable: true })
    compliancePercentage?: number;

    @Column({ name: "observations", type: "text" })
    observations!: string;

    @Column({ name: "id_unit_measure", type: "integer", nullable: true })
    unitMeasureId?: number;

    @ManyToOne(() => UnitMeasure)
    @JoinColumn({ name: "id_unit_measure" })
    unitMeasure?: UnitMeasure;
}
