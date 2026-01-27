import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "../../../../financial/projects/entities/project.entity";
import { ActionPlanIndicator } from "./action-plan-indicator.entity";

@Entity({ name: "project_action_indicator_relations" })
@Index(["projectId", "indicatorId"], { unique: true })
export class ProjectActionIndicatorRelation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project!: Project;

    @Column({ name: "indicator_id", type: "uuid" })
    indicatorId!: string;

    @ManyToOne(() => ActionPlanIndicator)
    @JoinColumn({ name: "indicator_id" })
    indicator!: ActionPlanIndicator;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
