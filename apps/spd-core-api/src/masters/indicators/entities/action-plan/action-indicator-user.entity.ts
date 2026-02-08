import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Relación entre un indicador del plan de acción y un usuario (del micro auth).
 * El userId se almacena como UUID y se resuelve contra auth-spd vía HTTP desde el front.
 */
@Entity({ name: "action_indicator_users" })
@Index(["indicatorId", "userId"], { unique: true })
export class ActionIndicatorUser {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "indicator_id", type: "uuid" })
    indicatorId!: string;

    @Column({ name: "user_id", type: "uuid", comment: "ID del usuario en auth-spd" })
    userId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "now()" })
    createdAt!: Date;
}
