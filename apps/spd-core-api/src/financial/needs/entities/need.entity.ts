import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import { PreviousStudy } from "../../../masters/previous-studies/entities/previous-study.entity";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";
import { OneToMany } from "typeorm";

@Entity({ name: "needs" })
export class Need {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "int", nullable: true })
    code?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    amount!: number;

    @Column({ type: "text", nullable: true })
    description?: string;

    @ManyToOne(() => PreviousStudy, (previousStudy) => previousStudy.needs, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "previous_study_id" })
    previousStudy!: PreviousStudy;

    @OneToMany(() => MasterContract, (masterContract) => masterContract.need)
    masterContracts?: MasterContract[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
