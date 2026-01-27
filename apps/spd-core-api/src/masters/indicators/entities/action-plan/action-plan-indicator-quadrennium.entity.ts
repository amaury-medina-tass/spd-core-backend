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
import { ActionPlanIndicator } from "./action-plan-indicator.entity";

@Entity({ name: "action_plan_indicator_quadrenniums" })
@Index(["indicator", "startYear", "endYear"], { unique: true })
export class ActionPlanIndicatorQuadrennium {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => ActionPlanIndicator)
    @JoinColumn({ name: "indicator_id" })
    indicator!: ActionPlanIndicator;

    @Column({ name: "indicator_id" })
    indicatorId!: string;

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
