import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VariableUser } from "../entities/variable-user.entity";
import { Variable } from "../entities/variable.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class VariableUsersService {
    private readonly logger = new Logger(VariableUsersService.name);

    constructor(
        @InjectRepository(VariableUser)
        private readonly repo: Repository<VariableUser>,
        @InjectRepository(Variable)
        private readonly variableRepo: Repository<Variable>,
        private readonly auditLog: AuditLogService,
    ) { }

    async findByVariableId(variableId: string) {
        const variable = await this.variableRepo.findOne({ where: { id: variableId } });
        if (!variable) {
            throw new NotFoundException({ message: "Variable no encontrada", code: ErrorCodes.VARIABLE_NOT_FOUND });
        }
        return this.repo.find({ where: { variableId }, order: { createdAt: "DESC" } });
    }

    async assign(variableId: string, userId: string, userName?: string) {
        const variable = await this.variableRepo.findOne({ where: { id: variableId } });
        if (!variable) {
            throw new NotFoundException({ message: "Variable no encontrada", code: ErrorCodes.VARIABLE_NOT_FOUND });
        }

        const existing = await this.repo.findOne({ where: { variableId, userId } });
        if (existing) {
            throw new ConflictException({ message: "El usuario ya está asignado a esta variable", code: ErrorCodes.VARIABLE_USER_ALREADY_ASSIGNED });
        }

        const entity = this.repo.create({ variableId, userId });
        const saved = await this.repo.save(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(AuditAction.VARIABLE_USER_ASSIGNED, AuditEntityType.VARIABLE, variableId, {
            entityName: `${variable.code} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { variableId, userId, userName: userDisplayName },
        });

        return saved;
    }

    async unassign(variableId: string, userId: string, userName?: string) {
        const entity = await this.repo.findOne({ where: { variableId, userId } });
        if (!entity) {
            throw new NotFoundException({ message: "La asignación no existe", code: ErrorCodes.VARIABLE_USER_NOT_ASSIGNED });
        }

        const variable = await this.variableRepo.findOne({ where: { id: variableId } });
        await this.repo.remove(entity);

        const userDisplayName = userName ?? `Usuario ${userId.substring(0, 8)}`;
        await this.auditLog.logSuccess(AuditAction.VARIABLE_USER_UNASSIGNED, AuditEntityType.VARIABLE, variableId, {
            entityName: `${variable?.code ?? variableId} - ${userDisplayName}`,
            system: SYSTEM_NAME,
            metadata: { variableId, userId, userName: userDisplayName },
        });
    }

    async findVariablesByUserId(userId: string): Promise<string[]> {
        const relations = await this.repo.find({ where: { userId }, select: ["variableId"] });
        return relations.map(r => r.variableId);
    }
}
