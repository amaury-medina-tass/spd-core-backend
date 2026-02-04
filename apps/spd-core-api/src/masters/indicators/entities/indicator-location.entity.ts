import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Check,
} from "typeorm";
import { IndicativePlanIndicator } from "./indicative-plan/indicative-plan-indicator.entity";
import { Location } from "../../locations/entities/location.entity";

@Entity({ name: "indicator_locations" })
@Check(`("indicative_indicator_id" IS NOT NULL AND "action_indicator_id" IS NULL) OR ("indicative_indicator_id" IS NULL AND "action_indicator_id" IS NOT NULL)`)
@Index(["indicativeIndicatorId", "locationId"], { unique: true, where: '"indicative_indicator_id" IS NOT NULL' })
@Index(["actionIndicatorId", "locationId"], { unique: true, where: '"action_indicator_id" IS NOT NULL' })
export class IndicatorLocation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "indicative_indicator_id", type: "uuid", nullable: true })
    indicativeIndicatorId?: string;

    @ManyToOne(() => IndicativePlanIndicator, { nullable: true })
    @JoinColumn({ name: "indicative_indicator_id" })
    indicativeIndicator?: IndicativePlanIndicator;

    @Column({ name: "action_indicator_id", type: "uuid", nullable: true })
    actionIndicatorId?: string;

    // Note: ActionPlanIndicator relation is handled separately since it's in a different entity file
    // The column is still defined for direct use

    @Column({ name: "location_id", type: "uuid" })
    locationId!: string;

    @ManyToOne(() => Location)
    @JoinColumn({ name: "location_id" })
    location!: Location;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
