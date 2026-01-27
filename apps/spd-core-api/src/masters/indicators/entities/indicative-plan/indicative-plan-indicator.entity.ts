import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IndicatorType } from "../common/indicator-type.entity";
import { IndicatorDirection } from "../common/indicator-direction.entity";
import { UnitMeasure } from "../common/unit-measure.entity";

@Entity({ name: "indicative_plan_indicators" })
export class IndicativePlanIndicator {
    @PrimaryGeneratedColumn("uuid", { name: "id_indicator" })
    id!: string;

    @Column({ name: "pillar_code", type: "varchar", length: 255, nullable: true })
    pillarCode?: string;

    @Column({ name: "pillar_name", type: "varchar", length: 255, nullable: true })
    pillarName?: string;

    @Column({ name: "component_code", type: "varchar", length: 50, nullable: true })
    componentCode?: string;

    @Column({ name: "component_name", type: "varchar", length: 255, nullable: true })
    componentName?: string;

    @Column({ name: "program_code", type: "varchar", length: 100, nullable: true })
    programCode?: string;

    @Column({ name: "program_name", type: "text", nullable: true })
    programName?: string;

    @Column({ name: "code", type: "varchar", length: 100, nullable: true, unique: true })
    code?: string;

    @Column({ name: "name", type: "text", nullable: true })
    name?: string;

    @Column({ name: "description", type: "varchar", length: 1000, nullable: true })
    description?: string;

    @Column({ name: "baseline", type: "varchar", length: 50, nullable: true })
    baseline?: string;

    @Column({ name: "observations", type: "varchar", length: 500 })
    observations!: string;

    @Column({ name: "advance_percentage", type: "numeric", default: 0, nullable: true })
    advancePercentage?: number;

    @Column({ name: "id_indicator_type", type: "integer", nullable: true })
    indicatorTypeId?: number;

    @ManyToOne(() => IndicatorType)
    @JoinColumn({ name: "id_indicator_type" })
    indicatorType?: IndicatorType;

    @Column({ name: "id_unit_measure", type: "integer", nullable: true })
    unitMeasureId?: number;

    @ManyToOne(() => UnitMeasure)
    @JoinColumn({ name: "id_unit_measure" })
    unitMeasure?: UnitMeasure;

    @Column({ name: "id_direction", type: "integer", nullable: true })
    directionId?: number;

    @ManyToOne(() => IndicatorDirection)
    @JoinColumn({ name: "id_direction" })
    direction?: IndicatorDirection;
}
