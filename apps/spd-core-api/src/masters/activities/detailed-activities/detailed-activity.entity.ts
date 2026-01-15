import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Cdp } from "../../../financial/cdp/cdp.entity";

@Entity({ name: "detailed_activities" })
export class DetailedActivity {
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
  cpc?: number;

  @Column({ type: "numeric", nullable: true })
  value?: number;

  @Column({ type: "numeric", nullable: true })
  balance?: number;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;

  @Column({ name: "id_pos_prev", type: "bigint", nullable: true })
  posPrevId?: string;

  @OneToMany(() => Cdp, (c) => c.activity)
  cdps!: Cdp[];
}
