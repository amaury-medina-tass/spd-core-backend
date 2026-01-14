import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cdp } from "../../financiero/cdp/cdp.entity";

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

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;
}
