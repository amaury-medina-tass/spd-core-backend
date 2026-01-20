import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";
import { Cdp } from "../../cdps/entities/cdp.entity";

@Entity({ name: "budget_records" })
export class BudgetRecord {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    number!: string;

    @Column({ name: "total_value", type: "numeric", precision: 18, scale: 2, nullable: true })
    totalValue?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true })
    balance?: number;

    @ManyToOne(() => MasterContract)
    @JoinColumn({ name: "contract_id" })
    contract?: MasterContract;

    @Column({ name: "contract_id", nullable: true })
    contractId?: string;

    @ManyToOne(() => Cdp)
    @JoinColumn({ name: "cdp_id" })
    cdp?: Cdp;

    @Column({ name: "cdp_id", nullable: true })
    cdpId?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp" })
    updateAt!: Date;
}
