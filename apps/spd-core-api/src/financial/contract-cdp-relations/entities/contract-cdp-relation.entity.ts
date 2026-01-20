import {
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";
import { Cdp } from "../../cdps/entities/cdp.entity";

@Entity({ name: "contract_cdp_relations" })
@Index(["masterContract", "cdp"], { unique: true })
export class ContractCdpRelation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => MasterContract)
    @JoinColumn({ name: "contract_id" })
    masterContract!: MasterContract;

    @ManyToOne(() => Cdp)
    @JoinColumn({ name: "cdp_id" })
    cdp!: Cdp;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
