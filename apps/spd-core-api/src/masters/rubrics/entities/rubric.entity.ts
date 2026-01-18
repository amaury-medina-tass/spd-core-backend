import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "rubrics" })
export class Rubric {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    code!: string;

    @Column({ type: "integer" })
    level!: number;

    @Column({ type: "text" })
    type!: string;

    @Column({ name: "legal_support", type: "text", default: "N/A" })
    legalSupport!: string;

    @Column({ name: "account_name", type: "text", nullable: true })
    accountName?: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
