import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Cdp } from "./cdp.entity";
import { Project } from "../../projects/entities/project.entity";

@Entity({ name: "cdp_projects" })
@Index(["cdp", "project"], { unique: true })
export class CdpProject {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Cdp)
    @JoinColumn({ name: "cdp_id" })
    cdp!: Cdp;

    @Column({ name: "cdp_id" })
    cdpId!: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project!: Project;

    @Column({ name: "project_id" })
    projectId!: string;

    @Column({ name: "allocated_value", type: "numeric", precision: 18, scale: 2, nullable: true, comment: "Valor total asignado a este proyecto en este CDP" })
    allocatedValue?: number;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
