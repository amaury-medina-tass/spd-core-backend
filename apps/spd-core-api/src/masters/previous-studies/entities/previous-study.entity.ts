import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Need } from "../../needs/entities/need.entity";

@Entity({ name: "previous_studies" })
export class PreviousStudy {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    code!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    status?: string;

    @OneToMany(() => Need, (need) => need.previousStudy)
    needs!: Need[];

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
