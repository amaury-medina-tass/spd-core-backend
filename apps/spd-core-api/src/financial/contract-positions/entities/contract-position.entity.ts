import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";
import { BudgetRecord } from "../../budget-records/entities/budget-record.entity";
import { CdpPositionFunding } from "../../cdps/entities/cdp-position-funding.entity";
import { CdpPosition } from "../../cdps/entities/cdp-position.entity";
import { DetailedActivity } from "../../../masters/detailed-activities/entities/detailed-activity.entity";
import { Rubric } from "../../../masters/rubrics/entities/rubric.entity";
import { FundingSource } from "../../funding-sources/entities/funding-source.entity";
import { Project } from "../../projects/entities/project.entity";

@Entity({ name: "contract_positions" })
export class ContractPosition {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => MasterContract)
    @JoinColumn({ name: "contract_id" })
    contract?: MasterContract;

    @Column({ name: "contract_id", nullable: true })
    contractId?: string;

    @ManyToOne(() => BudgetRecord)
    @JoinColumn({ name: "budget_record_id" })
    budgetRecord?: BudgetRecord;

    @Column({ name: "budget_record_id", nullable: true })
    budgetRecordId?: string;

    @ManyToOne(() => CdpPositionFunding)
    @JoinColumn({ name: "cdp_funding_id" })
    cdpFunding?: CdpPositionFunding;

    @Column({ name: "cdp_funding_id", nullable: true, comment: "Francotirador: indica de qué aporte específico restar" })
    cdpFundingId?: string;

    @Column({ name: "position_number", type: "text", nullable: true })
    positionNumber?: string;

    @Column({ type: "numeric", precision: 18, scale: 2, nullable: true })
    value?: number;

    @Column({ name: "allocated_value", type: "numeric", precision: 18, scale: 2, nullable: true })
    allocatedValue?: number;

    @Column({ name: "available_balance", type: "numeric", precision: 18, scale: 2, nullable: true })
    availableBalance?: number;

    @Column({ type: "text", nullable: true })
    description?: string;

    // Campos desnormalizados para velocidad y auditoría (snapshot)
    @ManyToOne(() => CdpPosition)
    @JoinColumn({ name: "cdp_position_id" })
    cdpPosition?: CdpPosition;

    @Column({ name: "cdp_position_id", nullable: true })
    cdpPositionId?: string;

    @ManyToOne(() => DetailedActivity)
    @JoinColumn({ name: "detailed_activity_id" })
    detailedActivity?: DetailedActivity;

    @Column({ name: "detailed_activity_id", nullable: true })
    detailedActivityId?: string;

    @ManyToOne(() => Rubric)
    @JoinColumn({ name: "rubric_id" })
    rubric?: Rubric;

    @Column({ name: "rubric_id", nullable: true })
    rubricId?: string;

    @ManyToOne(() => FundingSource)
    @JoinColumn({ name: "funding_source_id" })
    fundingSource?: FundingSource;

    @Column({ name: "funding_source_id", nullable: true })
    fundingSourceId?: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project?: Project;

    @Column({ name: "project_id", nullable: true })
    projectId?: string;

    @CreateDateColumn({ name: "create_at", type: "timestamp", default: () => "now()" })
    createAt!: Date;

    @UpdateDateColumn({ name: "update_at", type: "timestamp" })
    updateAt!: Date;
}
