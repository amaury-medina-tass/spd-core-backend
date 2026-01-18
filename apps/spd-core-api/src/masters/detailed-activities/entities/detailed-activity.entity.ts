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
import { Project } from "../../../financial/projects/entities/project.entity";
import { Rubric } from "../../rubrics/entities/rubric.entity";

@Entity({ name: "detailed_activities" })
@Index(["code", "project"], { unique: true })
export class DetailedActivity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    code!: string;

    @Column({ type: "text", nullable: true })
    name?: string;

    @Column({ type: "text", nullable: true })
    observations?: string;

    @Column({ name: "budget_ceiling", type: "numeric", precision: 18, scale: 2, default: 0 })
    budgetCeiling?: number;

    @Column({ name: "balance", type: "numeric", precision: 18, scale: 2, default: 0 })
    balance?: number;

    @Column({ type: "numeric", nullable: true })
    cpc?: number;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project!: Project;

    @Column({ name: "project_id" })
    projectId!: string;

    @ManyToOne(() => Rubric)
    @JoinColumn({ name: "rubric_id" })
    rubric?: Rubric;

    @Column({ name: "rubric_id", nullable: true })
    rubricId?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}

