import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { IndicativePlanIndicator } from './indicative-plan/indicative-plan-indicator.entity';
import { ActionPlanIndicator } from './action-plan/action-plan-indicator.entity';

@Entity('formulas')
@Check(
  `("indicative_indicator_id" IS NOT NULL AND "action_indicator_id" IS NULL) OR ("indicative_indicator_id" IS NULL AND "action_indicator_id" IS NOT NULL)`,
)
export class Formula {
  @PrimaryGeneratedColumn('uuid', { name: 'id_formula' })
  id: string;

  @Column('text', { name: 'formula', nullable: false })
  expression: string;

  @Column('json', { name: 'ast', nullable: false })
  ast: any;

  @Column({ name: 'indicative_indicator_id', nullable: true })
  indicativeIndicatorId: string;

  @ManyToOne(
    () => IndicativePlanIndicator,
    (indicativeIndicator) => indicativeIndicator.formulas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'indicative_indicator_id' })
  indicativeIndicator: IndicativePlanIndicator;

  @Column({ name: 'action_indicator_id', nullable: true })
  actionIndicatorId: string;

  @ManyToOne(
    () => ActionPlanIndicator,
    (actionIndicator) => actionIndicator.formulas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'action_indicator_id' })
  actionIndicator: ActionPlanIndicator;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;
}
