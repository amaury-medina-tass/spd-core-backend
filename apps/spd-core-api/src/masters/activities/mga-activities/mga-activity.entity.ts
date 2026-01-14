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
  @PrimaryGeneratedColumn("uuid", { name: "id_activity_m" })
  id!: string;

  @Column({ name: "activity_code", type: "character varying", nullable: false })
  code!: string;

  @Column({ name: "name_activity", type: "character varying", nullable: false })
  name!: string;

  @Column({ name: "project_code", type: "integer", nullable: false })
  projectCode!: number;

  @Column({ name: "observations", type: "character varying", nullable: true })
  observations?: string;

  @Column({ name: "value_activity", type: "numeric", nullable: true })
  value?: number;

  @Column({ name: "product_code", type: "integer", default: 0 })
  productCode!: number;

  @CreateDateColumn({ name: "creation_date", type: "date", default: () => "CURRENT_DATE" })
  creationDate!: Date;
}
