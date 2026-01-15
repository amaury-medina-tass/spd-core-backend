import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cdp } from "../cdp.entity";
import { DetailedActivity } from "../../../masters/activities/detailed-activities/detailed-activity.entity";
import { CreateCdpDto } from "../dto/create-cdp.dto";
import { UpdateCdpDto } from "../dto/update-cdp.dto";
import { OutboxService } from "../../../outbox/outbox.service";

@Injectable()
export class CdpService {
  constructor(
    @InjectRepository(Cdp) private repo: Repository<Cdp>,
    @InjectRepository(DetailedActivity) private activities: Repository<DetailedActivity>,
    private outbox: OutboxService
  ) { }

  private async recalcActivityCurrentValue(activityId: string) {
    // ✅ recalcula current_value = base_value + sum(activity_delta)
    const activity = await this.activities.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException("Activity not found");

    const result = await this.repo
      .createQueryBuilder("c")
      .select("COALESCE(SUM(c.activity_delta), 0)", "sum")
      .where("c.activityId = :activityId", { activityId })
      .getRawOne<{ sum: string }>();

    const totalDelta = Number(result?.sum ?? 0);
    // TODO: Verify logic with new schema (value, balance, cpc)
    // activity.value = Number(activity.value) + totalDelta; 
    // await this.activities.save(activity);
  }

  async create(dto: CreateCdpDto) {
    const activity = await this.activities.findOne({ where: { id: dto.activity_id } });
    if (!activity) throw new NotFoundException("Activity not found");

    const entity = await this.repo.save(
      this.repo.create({
        number: dto.number,
        activity,
        value: dto.value,
        activity_delta: dto.activity_delta ?? 0,
        notes: dto.notes,
      })
    );

    await this.recalcActivityCurrentValue(activity.id);

    // ✅ Evento de dominio (Outbox Pattern)
    // En producción esto lo publica el worker
    await this.outbox.enqueue("SPD.CDP_CREATED", {
      cdpId: entity.id,
      number: entity.number,
      activityId: activity.id,
      value: entity.value,
      activityDelta: entity.activity_delta,
      occurredAt: new Date().toISOString(),
    });

    return entity;
  }

  findAll() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("CDP not found");
    return item;
  }

  async update(id: string, dto: UpdateCdpDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    const saved = await this.repo.save(item);

    await this.recalcActivityCurrentValue(saved.activity.id);

    // ✅ Evento (comentado real)
    await this.outbox.enqueue("SPD.CDP_UPDATED", {
      cdpId: saved.id,
      activityId: saved.activity.id,
      value: saved.value,
      activityDelta: saved.activity_delta,
      occurredAt: new Date().toISOString(),
    });

    return saved;
  }
}
