import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PlanIndicativo } from "../plan-indicativo.entity";
import { MgaActivity } from "../../../masters/activities/mga-activities/mga-activity.entity";
import { CreatePlanIndicativoDto } from "../dto/create-plan-indicativo.dto";
import { UpdatePlanIndicativoDto } from "../dto/update-plan-indicativo.dto";
import { OutboxService } from "../../../outbox/outbox.service";

@Injectable()
export class PlanIndicativoService {
  constructor(
    @InjectRepository(PlanIndicativo) private repo: Repository<PlanIndicativo>,
    @InjectRepository(MgaActivity) private activities: Repository<MgaActivity>,
    private outbox: OutboxService
  ) { }

  async create(dto: CreatePlanIndicativoDto) {
    const activity = await this.activities.findOne({ where: { id: dto.activity_id } });
    if (!activity) throw new NotFoundException("Activity not found");

    const entity = await this.repo.save(
      this.repo.create({
        activity,
        component: dto.component,
        target: dto.target,
        advance: 0,
      })
    );

    await this.outbox.enqueue("SPD.DAGRD_PLAN_INDICATIVO_CREATED", {
      id: entity.id,
      activityId: activity.id,
      occurredAt: new Date().toISOString(),
    });

    return entity;
  }

  list() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }

  async updateAdvance(id: string, dto: UpdatePlanIndicativoDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("PlanIndicativo not found");

    item.advance = dto.advance;
    const saved = await this.repo.save(item);

    await this.outbox.enqueue("SPD.DAGRD_PLAN_INDICATIVO_ADVANCE_UPDATED", {
      id: saved.id,
      advance: saved.advance,
      occurredAt: new Date().toISOString(),
    });

    return saved;
  }
}
