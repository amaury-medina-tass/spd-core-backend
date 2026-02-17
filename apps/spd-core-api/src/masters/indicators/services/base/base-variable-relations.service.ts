import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { findPaginatedRelations } from "../../../../shared/helpers";
import { Variable } from "../../../variables/entities/variable.entity";
import { Formula } from "../../entities/formula.entity";
import { VariableAdvancesService } from "../../../../sub/variable-advances/services/variable-advances.service";

/**
 * Configuration for the concrete implementation of variable-indicator relations.
 */
export interface VariableRelationConfig {
    auditAssociateAction: AuditAction;
    auditDisassociateAction: AuditAction;
    auditEntityType: AuditEntityType;
    indicatorNotFoundCode: string;
    formulaIndicatorField: string;
    logLabel: string;
}

/**
 * Abstract base service for variable-indicator relations.
 * Eliminates duplication between VariableActionRelationsService and VariableIndicativeRelationsService.
 */
export abstract class BaseVariableRelationsService<TRelation, TIndicator> {
    protected abstract readonly logger: Logger;
    protected abstract readonly relationRepository: Repository<TRelation>;
    protected abstract readonly indicatorRepository: Repository<TIndicator>;
    protected abstract readonly variableRepository: Repository<Variable>;
    protected abstract readonly formulaRepository: Repository<Formula>;
    protected abstract readonly variableAdvancesService: VariableAdvancesService;
    protected abstract readonly auditLog: AuditLogService;
    protected abstract readonly config: VariableRelationConfig;

    async associate(indicatorId: string, variableId: string): Promise<TRelation> {
        await this.ensureIndicatorExists(indicatorId);

        try {
            const relation = this.relationRepository.create({
                variableId,
                indicatorId,
            } as any) as TRelation;
            const saved = await this.relationRepository.save(relation);

            const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } as any, select: ["id", "code", "name"] as any });
            const variable = await this.variableRepository.findOne({ where: { id: variableId }, select: ["id", "code", "name"] });

            await this.auditLog.logSuccess(this.config.auditAssociateAction, this.config.auditEntityType, (saved as any).id, {
                entityName: `${(indicator as any)?.code ?? indicatorId} - ${variable?.code ?? variableId}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId, variableId },
            });

            await this.recalculateIndicatorFormulas(indicatorId);
            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async disassociate(indicatorId: string, variableId: string): Promise<void> {
        const relation = await this.relationRepository.findOne({
            where: { variableId, indicatorId } as any,
        });

        if (!relation) {
            throw new NotFoundException({ message: `Relation between Indicator ${indicatorId} and Variable ${variableId} not found`, code: ErrorCodes.VARIABLE_INDICATOR_RELATION_NOT_FOUND });
        }

        const relationId = (relation as any).id;
        await this.relationRepository.remove(relation);

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } as any, select: ["id", "code", "name"] as any });
        const variable = await this.variableRepository.findOne({ where: { id: variableId }, select: ["id", "code", "name"] });

        await this.auditLog.logSuccess(this.config.auditDisassociateAction, this.config.auditEntityType, relationId, {
            entityName: `${(indicator as any)?.code ?? indicatorId} - ${variable?.code ?? variableId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, variableId },
        });

        await this.recalculateIndicatorFormulas(indicatorId);
    }

    async findPaginated(
        indicatorId: string,
        type: "associated" | "available" | "all" = "all",
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        await this.ensureIndicatorExists(indicatorId);

        const associatedIds = (await this.relationRepository.find({
            where: { indicatorId } as any,
            select: ["variableId"] as any
        })).map((r: any) => r.variableId);

        return findPaginatedRelations({
            associatedIds,
            queryBuilder: this.variableRepository.createQueryBuilder("variable"),
            alias: "variable",
            applySearch: (qb, s) => {
                qb.andWhere(new Brackets((b) => {
                    b.where("variable.code ILIKE :search", { search: `%${s}%` })
                        .orWhere("variable.name ILIKE :search", { search: `%${s}%` });
                }));
            },
            type,
            page,
            limit,
            search,
        });
    }

    private async ensureIndicatorExists(indicatorId: string) {
        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } as any });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicator with id ${indicatorId} not found`, code: this.config.indicatorNotFoundCode });
        }
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("The variable is already associated with this indicator.");
        }
        this.logger.error(error);
    }

    private async recalculateIndicatorFormulas(indicatorId: string): Promise<void> {
        try {
            const formulas = await this.formulaRepository.find({
                where: { [this.config.formulaIndicatorField]: indicatorId } as any,
            });

            this.logger.log(`Recalculating ${formulas.length} formula(s) for ${this.config.logLabel} indicator ${indicatorId}`);

            for (const formula of formulas) {
                await this.variableAdvancesService.recalculateForFormula(formula);
            }

            this.logger.log(`Recalculation completed for indicator ${indicatorId}`);
        } catch (error) {
            this.logger.error(`Failed to recalculate formulas for indicator ${indicatorId}:`, error);
        }
    }
}
