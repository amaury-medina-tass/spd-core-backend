import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Commune } from "./commune.entity";

@Entity({ name: "locations" })
export class Location {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "commune_id", type: "uuid" })
    communeId!: string;

    @ManyToOne(() => Commune)
    @JoinColumn({ name: "commune_id" })
    commune!: Commune;

    @Column({ type: "text", nullable: true })
    address?: string;

    @Column({ type: "numeric", precision: 10, scale: 6, nullable: true })
    latitude?: number;

    @Column({ type: "numeric", precision: 10, scale: 6, nullable: true })
    longitude?: number;

    @Column({ name: "normalized_address", type: "text", nullable: true })
    normalizedAddress?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}

