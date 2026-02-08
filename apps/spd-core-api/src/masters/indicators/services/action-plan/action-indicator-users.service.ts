import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActionIndicatorUser } from "../../entities/action-plan/action-indicator-user.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";

@Injectable()
export class ActionIndicatorUsersService {
    private readonly logger = new Logger(ActionIndicatorUsersService.name);

    constructor(
        @InjectRepository(ActionIndicatorUser)
        private readonly repo: Repository<ActionIndicatorUser>,
        @InjectRepository(ActionPlanIndicator)
        private readonly indicatorRepo: Repository<ActionPlanIndicator>,
        private readonly auditLog: AuditLogService,
    ) { }

    async findByIndicatorId(indicatorId: string) {
        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: "Indicador no encontrado", code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }
        return this.repo.find({ where: { indicatorId }, order: { createdAt: "DESC" } });
    }

    async assign(indicatorId: string, userId: string, userName?: string) {
        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: "Indicador no encontrado", code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }

        const existing = await this.repo.findOne({ where: { indicatorId, userId } });
        if (existing) {
            throw new ConflictException({ message: "El usuario ya está asignado a este indicador", code: ErrorCodes.INDICATOR_USER_ALREADY_ASSIGNED });
        }

        const entity = this.repo.create({ indicatorId, userId });
        const saved = await this.repo.save(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(AuditAction.ACTION_INDICATOR_USER_ASSIGNED, AuditEntityType.ACTION_INDICATOR, indicatorId, {
            entityName: `${indicator.code} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, userId, userName: userDisplayName },
        });

        return saved;
    }

    async unassign(indicatorId: string, userId: string, userName?: string) {
        const entity = await this.repo.findOne({ where: { indicatorId, userId } });
        if (!entity) {
            throw new NotFoundException({ message: "La asignación no existe", code: ErrorCodes.INDICATOR_USER_NOT_ASSIGNED });
        }

        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } });
        await this.repo.remove(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(AuditAction.ACTION_INDICATOR_USER_UNASSIGNED, AuditEntityType.ACTION_INDICATOR, indicatorId, {
            entityName: `${indicator?.code ?? indicatorId} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, userId, userName: userDisplayName },
        });
    }

    async findIndicatorsByUserId(userId: string): Promise<string[]> {
        const relations = await this.repo.find({ where: { userId }, select: ["indicatorId"] });
        return relations.map(r => r.indicatorId);
    }
}
