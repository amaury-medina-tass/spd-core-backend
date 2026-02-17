import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { findAllPaginatedByParent } from "../../../../shared/helpers";

/**
 * Configuration for the concrete implementation of goals (indicator or variable).
 */
export interface IndicatorGoalsConfig {
    indicatorNotFoundCode?: string;
    goalNotFoundCode: string;
    auditCreateAction: AuditAction;
    auditUpdateAction: AuditAction;
    auditDeleteAction: AuditAction;
    auditEntityType: AuditEntityType;
    goalLabel: string;
    /** Parent relation name in the entity (default: "indicator") */
    parentRelation?: string;
    /** Parent ID field name in the DTO (default: "indicatorId") */
    parentIdField?: string;
    /** Whether to validate parent existence on create (default: true) */
    checkParentOnCreate?: boolean;
    /** Duplicate key error message */
    duplicateMessage?: string;
    /** Query alias for the goal table (default: "g") */
    alias?: string;
}

/**
 * Abstract base service for goals (indicator or variable).
 * Eliminates duplication between ActionPlanIndicatorGoalsService, IndicativePlanIndicatorGoalsService and VariableGoalsService.
 */
export abstract class BaseIndicatorGoalsService<TGoal, TParent = any> {
    protected abstract readonly logger: Logger;
    protected abstract readonly goalRepository: Repository<TGoal>;
    protected abstract readonly auditLog: AuditLogService;
    protected abstract readonly config: IndicatorGoalsConfig;

    /** Override to provide a parent repository when checkParentOnCreate is true */
    protected readonly parentRepository?: Repository<TParent>;

    /** @deprecated Use parentRepository instead */
    protected get indicatorRepository(): Repository<TParent> | undefined {
        return this.parentRepository;
    }

    protected get goalAlias(): string {
        return this.config.alias ?? "g";
    }

    protected get parentRelation(): string {
        return this.config.parentRelation ?? "indicator";
    }

    protected get parentIdField(): string {
        return this.config.parentIdField ?? "indicatorId";
    }

    async create(createDto: any): Promise<TGoal> {
        const parentId = createDto[this.parentIdField];

        if (this.config.checkParentOnCreate !== false && this.parentRepository) {
            const parent = await this.parentRepository.findOne({ where: { id: parentId } as any });
            if (!parent) {
                throw new NotFoundException({ message: `Entidad con ID ${parentId} no encontrada`, code: this.config.indicatorNotFoundCode });
            }
        }

        try {
            const goal = this.goalRepository.create(createDto);
            const saved = await this.goalRepository.save(goal) as TGoal;

            await this.auditLog.logSuccess(this.config.auditCreateAction, this.config.auditEntityType, (saved as any).id, {
                entityName: `${this.config.goalLabel} - Year ${(saved as any).year}`,
                system: SYSTEM_NAME,
                metadata: { [this.parentIdField]: parentId, year: (saved as any).year, value: (saved as any).value },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllPaginated(
        parentId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const alias = this.goalAlias;
        const relation = this.parentRelation;

        const queryBuilder = this.goalRepository
            .createQueryBuilder(alias)
            .leftJoin(`${alias}.${relation}`, relation)
            .where(`${relation}.id = :parentId`, { parentId })
            .addSelect([alias]);

        return findAllPaginatedByParent({
            queryBuilder,
            alias,
            applySearch: (qb, s) => {
                qb.andWhere(new Brackets((b) => {
                    b.where(`${relation}.code ILIKE :search`, { search: `%${s}%` })
                        .orWhere(`${relation}.name ILIKE :search`, { search: `%${s}%` })
                        .orWhere(`${alias}.year::text ILIKE :search`, { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "year", "value", `${relation}.code`, `${relation}.name`],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }

    async findAllByParent(parentId: string): Promise<TGoal[]> {
        return this.goalRepository.find({
            where: { [this.parentIdField]: parentId } as any,
            order: { year: "ASC" } as any,
        });
    }

    /** @deprecated Use findAllByParent instead */
    async findAllByIndicator(parentId: string): Promise<TGoal[]> {
        return this.findAllByParent(parentId);
    }

    async findOne(id: string): Promise<TGoal> {
        const goal = await this.goalRepository.findOne({ where: { id } as any });
        if (!goal) {
            throw new NotFoundException({ message: `Goal with ID ${id} not found`, code: this.config.goalNotFoundCode });
        }
        return goal;
    }

    async update(id: string, updateDto: any): Promise<TGoal> {
        const goal = await this.goalRepository.preload({ id, ...updateDto });
        if (!goal) {
            throw new NotFoundException({ message: `Goal with ID ${id} not found`, code: this.config.goalNotFoundCode });
        }

        try {
            const saved = await this.goalRepository.save(goal);

            await this.auditLog.logSuccess(this.config.auditUpdateAction, this.config.auditEntityType, (saved as any).id, {
                entityName: `${this.config.goalLabel} - Year ${(saved as any).year}`,
                system: SYSTEM_NAME,
                metadata: { [this.parentIdField]: (saved as any)[this.parentIdField], year: (saved as any).year, value: (saved as any).value },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const goal = await this.goalRepository.findOne({ where: { id } as any });
        if (!goal) {
            throw new NotFoundException({ message: `Goal with ID ${id} not found`, code: this.config.goalNotFoundCode });
        }

        await this.goalRepository.remove(goal);

        await this.auditLog.logSuccess(this.config.auditDeleteAction, this.config.auditEntityType, id, {
            entityName: `${this.config.goalLabel} - Year ${(goal as any).year}`,
            system: SYSTEM_NAME,
        });
    }

    protected handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(this.config.duplicateMessage ?? "Ya existe una meta para este indicador y año.");
        }
        this.logger.error(error);
    }
}
