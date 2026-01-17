import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Need } from "../../needs/entities/need.entity";
import { Contractor } from "../../contractors/entities/contractor.entity";

@Entity({ name: "master_contracts" })
export class MasterContract {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    number!: string;

    @Column({ type: "text", nullable: true })
    object?: string;

    @Column({ name: "total_value", type: "numeric", precision: 18, scale: 2, nullable: true })
    totalValue?: number;

    @Column({ name: "start_date", type: "date", nullable: true })
    startDate?: Date;

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate?: Date;

    @Column({ type: "text", nullable: true })
    state?: string;

    @ManyToOne(() => Contractor, (contractor) => contractor.masterContracts)
    @JoinColumn({ name: "contractor_id" })
    contractor!: Contractor;

    @ManyToOne(() => Need, (need) => need.masterContracts, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "need_id" })
    need!: Need;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
