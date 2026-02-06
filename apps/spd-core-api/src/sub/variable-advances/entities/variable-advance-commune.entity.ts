import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { VariableAdvance } from "./variable-advance.entity";
import { Commune } from "../../../masters/locations/entities/commune.entity";

@Entity({ name: "variable_advance_communes" })
@Index(["variableAdvanceId", "communeId"], { unique: true })
export class VariableAdvanceCommune {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "variable_advance_id", type: "uuid" })
    variableAdvanceId!: string;

    @ManyToOne(() => VariableAdvance)
    @JoinColumn({ name: "variable_advance_id" })
    variableAdvance!: VariableAdvance;

    @Column({ name: "commune_id", type: "uuid" })
    communeId!: string;

    @ManyToOne(() => Commune)
    @JoinColumn({ name: "commune_id" })
    commune!: Commune;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
