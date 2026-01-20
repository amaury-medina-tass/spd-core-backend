import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "products" })
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "product_code", type: "text" })
    productCode!: string;

    @Column({ name: "product_name", type: "text" })
    productName!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ name: "indicator_code", type: "text", unique: true })
    indicatorCode!: string;

    @Column({ name: "indicator_name", type: "text" })
    indicatorName!: string;

    @Column({ name: "measured_unit", type: "text", nullable: true })
    measuredUnit?: string;

    @Column({ name: "unit_type", type: "text", nullable: true })
    unitType?: string;

    @Column({ name: "is_main_indicator", type: "boolean", default: false })
    isMainIndicator!: boolean;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
    updateAt!: Date;
}
