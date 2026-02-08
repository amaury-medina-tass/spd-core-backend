import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Relación entre una variable y un usuario (del micro auth).
 * El userId se almacena como UUID y se resuelve contra auth-spd vía HTTP desde el front.
 */
@Entity({ name: "variable_users" })
@Index(["variableId", "userId"], { unique: true })
export class VariableUser {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "variable_id", type: "uuid" })
    variableId!: string;

    @Column({ name: "user_id", type: "uuid", comment: "ID del usuario en auth-spd" })
    userId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "now()" })
    createdAt!: Date;
}
