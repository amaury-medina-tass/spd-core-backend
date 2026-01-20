import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Project } from "../../projects/entities/project.entity";

@Entity({ name: "poai_ppa" })
@Index(["project", "year"], { unique: true })
export class PoaiPpa {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Project, { nullable: false })
    @JoinColumn({ name: "project_id" })
    project!: Project;

    @Column({ name: "project_code", type: "text", nullable: true })
    projectCode?: string;

    @Column({ type: "integer" })
    year!: number;

    @Column({ name: "projected_poai", type: "numeric", precision: 18, scale: 2, default: 0 })
    projectedPoai!: number;

    @Column({ name: "assigned_poai", type: "numeric", precision: 18, scale: 2, default: 0 })
    assignedPoai!: number;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
