import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Cdp } from "../../financial/cdp/cdp.entity";

@Entity({ name: "contratos_marco" })
export class ContratoMarco {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  contract_number!: string;

  @ManyToOne(() => Cdp, { eager: true, onDelete: "RESTRICT" })
  cdp!: Cdp;

  @Column({ type: "numeric", default: 0 })
  consumed_value!: number;

  @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
  createAt!: Date;

  @UpdateDateColumn({ name: "update_at", type: "timestamp", default: () => "now()" })
  updateAt!: Date;
}
