import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
    OneToMany,
} from "typeorm";
import { PreviousStudy } from "../../previous-studies/entities/previous-study.entity";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";

@Entity({ name: "needs" })
export class Need {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    code?: string;

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
