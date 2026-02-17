import { ConflictException, Logger, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";

/**
 * Configuration for the concrete implementation of indicator-user relations.
 */
export interface IndicatorUsersConfig {
    indicatorNotFoundCode: string;
    auditAssignAction: AuditAction;
    auditUnassignAction: AuditAction;
    auditEntityType: AuditEntityType;
}

/**
 * Abstract base service for indicator-user assignments.
 * Eliminates duplication between ActionIndicatorUsersService and IndicativeIndicatorUsersService.
 */
export abstract class BaseIndicatorUsersService<TUser, TIndicator> {
    protected abstract readonly logger: Logger;
    protected abstract readonly repo: Repository<TUser>;
    protected abstract readonly indicatorRepo: Repository<TIndicator>;
    protected abstract readonly auditLog: AuditLogService;
    protected abstract readonly config: IndicatorUsersConfig;

    async findByIndicatorId(indicatorId: string) {
        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } as any });
        if (!indicator) {
            throw new NotFoundException({ message: "Indicador no encontrado", code: this.config.indicatorNotFoundCode });
        }
        return this.repo.find({ where: { indicatorId } as any, order: { createdAt: "DESC" } as any });
    }

    async assign(indicatorId: string, userId: string, userName?: string) {
        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } as any });
        if (!indicator) {
            throw new NotFoundException({ message: "Indicador no encontrado", code: this.config.indicatorNotFoundCode });
        }

        const existing = await this.repo.findOne({ where: { indicatorId, userId } as any });
        if (existing) {
            throw new ConflictException({ message: "El usuario ya está asignado a este indicador", code: ErrorCodes.INDICATOR_USER_ALREADY_ASSIGNED });
        }

        const entity = this.repo.create({ indicatorId, userId } as any);
        const saved = await this.repo.save(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(this.config.auditAssignAction, this.config.auditEntityType, indicatorId, {
            entityName: `${(indicator as any).code} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, userId, userName: userDisplayName },
        });

        return saved;
    }

    async unassign(indicatorId: string, userId: string, userName?: string) {
        const entity = await this.repo.findOne({ where: { indicatorId, userId } as any });
        if (!entity) {
            throw new NotFoundException({ message: "La asignación no existe", code: ErrorCodes.INDICATOR_USER_NOT_ASSIGNED });
        }

        const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } as any });
        await this.repo.remove(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(this.config.auditUnassignAction, this.config.auditEntityType, indicatorId, {
            entityName: `${(indicator as any)?.code ?? indicatorId} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, userId, userName: userDisplayName },
        });
    }

    async findIndicatorsByUserId(userId: string): Promise<string[]> {
        const relations = await this.repo.find({ where: { userId } as any, select: ["indicatorId"] as any });
        return (relations as any[]).map(r => r.indicatorId);
    }
}
