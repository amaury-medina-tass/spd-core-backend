import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PlanAction } from "../plan-action.entity";
import { DetailedActivity } from "../../../masters/activities/detailed-activities/detailed-activity.entity";
import { CreatePlanActionDto } from "../dto/create-plan-action.dto";
import { UpdatePlanActionDto } from "../dto/update-plan-action.dto";
import { OutboxService } from "../../../outbox/outbox.service";

@Injectable()
export class PlanActionService {
  constructor(
    @InjectRepository(PlanAction) private repo: Repository<PlanAction>,
    @InjectRepository(DetailedActivity) private activities: Repository<DetailedActivity>,
    private outbox: OutboxService
  ) { }

  async create(dto: CreatePlanActionDto) {
    const activity = await this.activities.findOne({ where: { id: dto.activity_id } });
    if (!activity) throw new NotFoundException("Activity not found");

    const entity = await this.repo.save(
      this.repo.create({
        activity,
        line: dto.line,
        target: dto.target,
        advance: 0,
      })
    );

    await this.outbox.enqueue("SPD.DAGRD_PLAN_ACTION_CREATED", {
      id: entity.id,
      activityId: activity.id,
      occurredAt: new Date().toISOString(),
    });

    return entity;
  }

  list() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }

  async updateAdvance(id: string, dto: UpdatePlanActionDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("PlanAction not found");

    item.advance = dto.advance;
    const saved = await this.repo.save(item);

    await this.outbox.enqueue("SPD.DAGRD_PLAN_ACTION_ADVANCE_UPDATED", {
      id: saved.id,
      advance: saved.advance,
      occurredAt: new Date().toISOString(),
    });

    return saved;
  }
}
