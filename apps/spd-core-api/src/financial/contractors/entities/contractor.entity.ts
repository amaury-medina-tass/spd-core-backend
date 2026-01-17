import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";

@Entity({ name: "contractors" })
export class Contractor {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    nit!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "text", nullable: true })
    address?: string;

    @Column({ type: "text", nullable: true })
    phone?: string;

    @Column({ type: "text", nullable: true })
    email?: string;

    @OneToMany(() => MasterContract, (masterContract) => masterContract.contractor)
    masterContracts?: MasterContract[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
