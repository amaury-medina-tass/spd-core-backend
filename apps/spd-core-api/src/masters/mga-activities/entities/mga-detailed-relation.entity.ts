import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { MgaActivity } from "./mga-activity.entity";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";

@Entity({ name: "mga_detailed_relations" })
@Index(["mgaActivityId", "detailedActivityId"], { unique: true })
export class MgaDetailedRelation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => MgaActivity, (mgaActivity) => mgaActivity.detailedRelations)
    @JoinColumn({ name: "mga_activity_id" })
    mgaActivity!: MgaActivity;

    @Column({ name: "mga_activity_id" })
    mgaActivityId!: string;

    @ManyToOne(() => DetailedActivity)
    @JoinColumn({ name: "detailed_activity_id" })
    detailedActivity!: DetailedActivity;

    @Column({ name: "detailed_activity_id" })
    detailedActivityId!: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
