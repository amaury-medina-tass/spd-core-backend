import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Cdp } from "./cdp.entity";
import { Rubric } from "../../../masters/rubrics/entities/rubric.entity";

@Entity({ name: "cdp_positions" })
@Index(["cdp", "positionNumber"], { unique: true })
export class CdpPosition {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Cdp, (cdp) => cdp.positions)
    @JoinColumn({ name: "cdp_id" })
    cdp!: Cdp;

    @Column({ name: "cdp_id" })
    cdpId!: string;

    @Column({ name: "position_number", type: "text", comment: "Origen: d.Posicion (Ej. 0010)" })
    positionNumber!: string;

    @ManyToOne(() => Rubric)
    @JoinColumn({ name: "rubric_id" })
    rubric?: Rubric;

    @Column({ name: "rubric_id", nullable: true, comment: "Origen: d.CodigoPosPre" })
    rubricId?: string;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true, comment: "Valor Total reservado en este rubro" })
    value?: number;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true, comment: "Saldo total disponible en este rubro" })
    balance?: number;

    @Column({ type: "text", nullable: true, comment: "Observaciones específicas de esta posición/rubro" })
    observations?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
