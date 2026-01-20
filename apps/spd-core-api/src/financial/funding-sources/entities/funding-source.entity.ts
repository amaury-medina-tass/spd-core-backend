import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "funding_sources" })
export class FundingSource {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true, comment: "Origen: CODIGOFONDO" })
    code!: string;

    @Column({ type: "text", nullable: true, comment: "Origen: BUGET_ORIGIN" })
    name?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp" })
    updateAt!: Date;
}
