import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndicatorAdvance } from "../entities/indicator-advance.entity";

import { IndicativePlanIndicator } from "../../../masters/indicators/entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../../../masters/indicators/entities/action-plan/action-plan-indicator.entity";

@Injectable()
export class IndicatorAdvancesService {
    private readonly logger = new Logger(IndicatorAdvancesService.name);

    constructor(
        @InjectRepository(IndicatorAdvance)
        private readonly repository: Repository<IndicatorAdvance>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicativeRepo: Repository<IndicativePlanIndicator>,
        @InjectRepository(ActionPlanIndicator)
        private readonly actionRepo: Repository<ActionPlanIndicator>,
    ) { }

    async createOrUpdate(
        indicatorId: string,
        type: 'action' | 'indicative',
        year: number,
        month: number | null,
        value: number,
        manager?: any // Optional Transaction Manager
    ) {
        const repo = manager ? manager.getRepository(IndicatorAdvance) : this.repository;

        // Use IsNull() or explicit query for correct null matching
        const qb = repo.createQueryBuilder("ia")
            .where("ia.year = :year", { year });

        if (month !== null && month !== undefined) {
            qb.andWhere("ia.month = :month", { month });
        } else {
            qb.andWhere("ia.month IS NULL");
        }

        if (type === 'action') {
            qb.andWhere("ia.actionIndicatorId = :indicatorId", { indicatorId });
        } else {
            qb.andWhere("ia.indicativeIndicatorId = :indicatorId", { indicatorId });
        }

        let advance = await qb.getOne();

        if (!advance) {
            advance = repo.create({
                year,
                month,
                value,
                actionIndicatorId: type === 'action' ? indicatorId : null,
                indicativeIndicatorId: type === 'indicative' ? indicatorId : null,
            });
        } else {
            advance.value = value;
        }

        const saved = await repo.save(advance);

        // Update Parent Cache
        await this.updateParentCache(indicatorId, type, manager);

        return saved;
    }

    private async updateParentCache(indicatorId: string, type: 'action' | 'indicative', manager?: any) {
        // Calculate Sum
        const repo = manager ? manager.getRepository(IndicatorAdvance) : this.repository;

        const sumResult = await repo.createQueryBuilder("ia")
            .select("SUM(ia.value)", "total")
            .where(type === 'action' ? "ia.actionIndicatorId = :indicatorId" : "ia.indicativeIndicatorId = :indicatorId", { indicatorId })
            .getRawOne();

        const total = parseFloat(sumResult?.total || "0");
        this.logger.log(`Updated Cache for ${type} indicator ${indicatorId}: ${total}`);

        if (type === 'action') {
            const actionRepo = manager ? manager.getRepository(ActionPlanIndicator) : this.actionRepo;
            await actionRepo.update(indicatorId, { compliancePercentage: total });
        } else {
            const indicativeRepo = manager ? manager.getRepository(IndicativePlanIndicator) : this.indicativeRepo;
            await indicativeRepo.update(indicatorId, { advancePercentage: total });
        }
    }
}
