import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "unit_measures" })
export class UnitMeasure {
    @PrimaryColumn({ name: "id_unit_measure", type: "integer" })
    id!: number;

    @Column({ name: "name", type: "varchar", length: 100, nullable: true })
    name?: string;

    @Column({ name: "description", type: "text", nullable: true })
    description?: string;
}
