import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "indicator_types" })
export class IndicatorType {
    @PrimaryColumn({ name: "id_indicator_type", type: "integer" })
    id!: number;

    @Column({ name: "name", type: "varchar", length: 100, nullable: true })
    name?: string;

    @Column({ name: "description", type: "text", nullable: true })
    description?: string;
}
