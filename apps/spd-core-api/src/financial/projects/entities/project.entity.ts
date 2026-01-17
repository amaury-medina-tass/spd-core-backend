import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    AfterLoad,
} from "typeorm";
import { Dependency } from "../../dependencies/entities/dependency.entity";

@Entity({ name: "projects" })
export class Project {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    financialExecutionPercentage!: number;

    @AfterLoad()
    calculateFinancialExecution() {
        const current = Number(this.currentBudget || 0);
        const execution = Number(this.execution || 0);
        this.financialExecutionPercentage = current !== 0
            ? Math.round((execution / current) * 100) / 100
            : 0;
    }

    @Column({ type: "text", unique: true })
    code!: string;

    @Column({ type: "text", nullable: true })
    name?: string;

    @Column({ name: "initial_budget", type: "numeric", precision: 18, scale: 2, default: 0 })
    initialBudget?: number;

    @Column({ name: "current_budget", type: "numeric", precision: 18, scale: 2, default: 0 })
    currentBudget?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    execution?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    commitment?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    payments?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
    invoiced?: number;

    @Column({ type: "text", default: "UNKNOWN" })
    origin?: string;

    @Column({ type: "boolean", default: true })
    state!: boolean;

    @ManyToOne(() => Dependency, (dependency) => dependency.projects)
    @JoinColumn({ name: "dependency_id" })
    dependency!: Dependency;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
