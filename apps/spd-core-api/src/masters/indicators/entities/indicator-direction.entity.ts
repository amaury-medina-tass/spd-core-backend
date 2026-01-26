import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "indicator_directions" })
export class IndicatorDirection {
    @PrimaryColumn({ name: "id_direction", type: "integer" })
    id!: number;

    @Column({ name: "name", type: "varchar", length: 100 })
    name!: string;

    @Column({ name: "description", type: "text", default: "sin descripcion", nullable: true })
    description?: string;
}
