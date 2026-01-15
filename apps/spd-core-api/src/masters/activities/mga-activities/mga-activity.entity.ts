import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "mga_activity" })
export class MgaActivity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "character varying", nullable: false })
  code!: string;

  @Column({ type: "character varying", nullable: false })
  name!: string;

  @Column({ name: "project_code", type: "integer", nullable: false })
  projectCode!: number;

  @Column({ type: "character varying", nullable: true })
  observations?: string;

  @Column({ type: "numeric", nullable: true })
  value?: number;

  @Column({ name: "product_code", type: "integer", default: 0 })
  productCode!: number;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
