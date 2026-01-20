import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Need } from "../../../financial/needs/entities/need.entity";

@Entity({ name: "previous_studies" })
export class PreviousStudy {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    code!: string;

    @Column({ type: "text", nullable: true })
    status?: string;

    @OneToMany(() => Need, (need) => need.previousStudy)
    needs!: Need[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
