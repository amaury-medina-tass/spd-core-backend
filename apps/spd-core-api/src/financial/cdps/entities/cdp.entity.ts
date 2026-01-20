import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CdpPosition } from "./cdp-position.entity";
import { CdpProject } from "./cdp-project.entity";

@Entity({ name: "cdps" })
export class Cdp {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true, comment: "Origen: NumeroCdp" })
    number!: string;

    @Column({ name: "total_value", type: "numeric", precision: 18, scale: 2, nullable: true })
    totalValue?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true })
    balance?: number;

    @Column({ name: "date_issue", type: "timestamp", nullable: true })
    dateIssue?: Date;

    @OneToMany(() => CdpPosition, (position) => position.cdp)
    positions?: CdpPosition[];

    @OneToMany(() => CdpProject, (cdpProject) => cdpProject.cdp)
    cdpProjects?: CdpProject[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp" })
    updateAt!: Date;
}
