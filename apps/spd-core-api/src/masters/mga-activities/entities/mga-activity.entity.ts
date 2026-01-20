import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Project } from "../../../financial/projects/entities/project.entity";
import type { MgaDetailedRelation } from "./mga-detailed-relation.entity";
import { Product } from "../../products/entities/product.entity";

@Entity({ name: "mga_activities" })
@Index(["code", "project"], { unique: true })
export class MgaActivity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    code!: string;

    @Column({ type: "text", nullable: true })
    name?: string;

    @Column({ type: "text", nullable: true })
    observations?: string;



    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product?: Product;

    @Column({ name: "product_id", nullable: true })
    productId?: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project!: Project;

    @Column({ name: "project_id" })
    projectId!: string;

    @OneToMany("MgaDetailedRelation", "mgaActivity")
    detailedRelations?: MgaDetailedRelation[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;

    detailedActivitiesCount?: number;
}