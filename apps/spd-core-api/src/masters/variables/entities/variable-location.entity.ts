import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Variable } from "./variable.entity";
import { Location } from "../../locations/entities/location.entity";

@Entity({ name: "variable_locations" })
@Index(["variableId", "locationId"], { unique: true })
export class VariableLocation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "variable_id", type: "uuid" })
    variableId!: string;

    @ManyToOne(() => Variable)
    @JoinColumn({ name: "variable_id" })
    variable!: Variable;

    @Column({ name: "location_id", type: "uuid" })
    locationId!: string;

    @ManyToOne(() => Location)
    @JoinColumn({ name: "location_id" })
    location!: Location;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;
}
