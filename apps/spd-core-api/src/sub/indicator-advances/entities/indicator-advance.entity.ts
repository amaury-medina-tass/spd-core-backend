import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { IndicativePlanIndicator } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../../masters/indicators/entities/action-plan/action-plan-indicator.entity";

@Entity("indicator_advances")
@Index(["indicativeIndicatorId", "year", "month"], { unique: true })
@Index(["actionIndicatorId", "year", "month"], { unique: true })
// @Check(`("indicativeIndicatorId" IS NOT NULL AND "actionIndicatorId" IS NULL) OR ("indicativeIndicatorId" IS NULL AND "actionIndicatorId" IS NOT NULL)`) // Optional: TypeORM Check syntax might vary or fail depending on driver support/setup. Leaving as database constraint if needed manually.
export class IndicatorAdvance {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "indicative_indicator_id", type: "uuid", nullable: true })
    indicativeIndicatorId: string | null;

    @ManyToOne(() => IndicativePlanIndicator, { nullable: true })
    @JoinColumn({ name: "indicative_indicator_id" })
    indicativeIndicator: IndicativePlanIndicator | null;

    @Column({ name: "action_indicator_id", type: "uuid", nullable: true })
    actionIndicatorId: string | null;

    @ManyToOne(() => ActionPlanIndicator, { nullable: true })
    @JoinColumn({ name: "action_indicator_id" })
    actionIndicator: ActionPlanIndicator | null;

    @Column({ type: "int" })
    year: number;

    @Column({ type: "int", nullable: true })
    month: number | null;

    @Column({ type: "decimal", precision: 18, scale: 2 })
    value: number;

    @CreateDateColumn({ name: "create_at" })
    createAt: Date;

    @UpdateDateColumn({ name: "update_at" })
    updateAt: Date;
}
