import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Cdp } from "../entities/cdp.entity";
import { CdpPosition } from "../entities/cdp-position.entity";
import { CdpPositionFunding } from "../entities/cdp-position-funding.entity";
import { CdpProject } from "../entities/cdp-project.entity";
import { DetailedActivity } from "../../../masters/detailed-activities/entities/detailed-activity.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class CdpFundingService {
    constructor(
        @InjectRepository(Cdp)
        private cdpRepo: Repository<Cdp>,
        @InjectRepository(CdpPosition)
        private positionRepo: Repository<CdpPosition>,
        @InjectRepository(CdpPositionFunding)
        private fundingRepo: Repository<CdpPositionFunding>,
        @InjectRepository(CdpProject)
        private cdpProjectRepo: Repository<CdpProject>,
        @InjectRepository(DetailedActivity)
        private detailedActivityRepo: Repository<DetailedActivity>,
        private dataSource: DataSource,
        private readonly auditLog: AuditLogService,
    ) { }

    async consumeActivity(
        positionId: string,
        detailedActivityId: string,
        amount: number
    ): Promise<CdpPositionFunding> {
        if (amount <= 0) {
            throw new BadRequestException({ message: "El monto debe ser mayor a 0", code: ErrorCodes.CDP_INVALID_AMOUNT });
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Get position with CDP context
            const position = await queryRunner.manager
                .createQueryBuilder(CdpPosition, "pos")
                .innerJoinAndSelect("pos.cdp", "cdp")
                .where("pos.id = :positionId", { positionId })
                .getOne();

            if (!position) {
                throw new NotFoundException({ message: "Posición de CDP no encontrada", code: ErrorCodes.CDP_POSITION_NOT_FOUND });
            }

            // 2. Get detailed activity and validate balance
            const activity = await queryRunner.manager.findOne(DetailedActivity, {
                where: { id: detailedActivityId }
            });

            if (!activity) {
                throw new NotFoundException({ message: "Actividad detallada no encontrada", code: ErrorCodes.DETAILED_ACTIVITY_NOT_FOUND });
            }

            const currentBalance = Number(activity.balance) || 0;
            if (currentBalance < amount) {
                throw new BadRequestException({
                    message: `Saldo insuficiente. Disponible: ${currentBalance}, Solicitado: ${amount}`,
                    code: ErrorCodes.CDP_INSUFFICIENT_BALANCE,
                });
            }

            // 3. Validate activity belongs to CDP's project
            const cdpProject = await queryRunner.manager.findOne(CdpProject, {
                where: { cdpId: position.cdpId, projectId: activity.projectId }
            });

            if (!cdpProject) {
                throw new BadRequestException({ message: "La actividad no pertenece al proyecto del CDP", code: ErrorCodes.CDP_ACTIVITY_WRONG_PROJECT });
            }

            // 4. Create or update funding (upsert)
            let funding = await queryRunner.manager.findOne(CdpPositionFunding, {
                where: { cdpPositionId: positionId, detailedActivityId: detailedActivityId }
            });

            if (funding) {
                funding.assignedValue = Number(funding.assignedValue || 0) + amount;
                funding.balance = Number(funding.balance || 0) + amount;
            } else {
                funding = queryRunner.manager.create(CdpPositionFunding, {
                    cdpPositionId: positionId,
                    detailedActivityId: detailedActivityId,
                    assignedValue: amount,
                    balance: amount,
                });
            }
            await queryRunner.manager.save(CdpPositionFunding, funding);

            // 5. Update CDP position (add to balance and value)
            await queryRunner.manager.update(CdpPosition, positionId, {
                value: () => `COALESCE(value, 0) + ${amount}`,
                balance: () => `COALESCE(balance, 0) + ${amount}`,
            });

            // 6. Update CDP header (add to balance and total_value)
            await queryRunner.manager.update(Cdp, position.cdpId, {
                totalValue: () => `COALESCE(total_value, 0) + ${amount}`,
                balance: () => `COALESCE(balance, 0) + ${amount}`,
            });

            // 7. Update CDP project allocated_value
            await queryRunner.manager.update(
                CdpProject,
                { cdpId: position.cdpId, projectId: activity.projectId },
                { allocatedValue: () => `COALESCE(allocated_value, 0) + ${amount}` }
            );

            // 8. Debit the activity balance
            await queryRunner.manager.update(DetailedActivity, detailedActivityId, {
                balance: () => `COALESCE(balance, 0) - ${amount}`,
            });

            await queryRunner.commitTransaction();

            await this.auditLog.logSuccess(AuditAction.CDP_ACTIVITY_CONSUMED, AuditEntityType.CDP_POSITION_FUNDING, funding.id, {
                system: SYSTEM_NAME,
                metadata: { positionId, detailedActivityId, amount },
            });

            // Reload funding with relations for response
            return this.fundingRepo.findOne({
                where: { id: funding.id },
                relations: ["cdpPosition", "detailedActivity"]
            }) as Promise<CdpPositionFunding>;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
