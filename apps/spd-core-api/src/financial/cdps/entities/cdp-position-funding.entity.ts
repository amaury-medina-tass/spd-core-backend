import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { CdpPosition } from "./cdp-position.entity";
import { DetailedActivity } from "../../../masters/detailed-activities/entities/detailed-activity.entity";

@Entity({ name: "cdp_position_funding" })
@Index(["cdpPosition", "detailedActivity"], { unique: true })
export class CdpPositionFunding {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => CdpPosition)
    @JoinColumn({ name: "cdp_position_id" })
    cdpPosition!: CdpPosition;

    @Column({ name: "cdp_position_id" })
    cdpPositionId!: string;

    @ManyToOne(() => DetailedActivity)
    @JoinColumn({ name: "detailed_activity_id" })
    detailedActivity!: DetailedActivity;

    @Column({ name: "detailed_activity_id" })
    detailedActivityId!: string;

    @Column({ name: "assigned_value", type: "numeric", precision: 18, scale: 2, nullable: true, comment: "Aporte de esta actividad" })
    assignedValue?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true, comment: "Saldo restante de este aporte" })
    balance?: number;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
