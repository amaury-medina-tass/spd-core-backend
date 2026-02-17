import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { ErrorCodes } from "@common/errors/error-codes";
import { buildPaginatedMeta, calculateSkip, validateSortParams, applyOrderBy } from "../../../../shared/helpers";

/**
 * Configuration for the concrete implementation of plan indicators.
 */
export interface PlanIndicatorsConfig {
    alreadyExistsCode: string;
    notFoundCode: string;
    auditCreateAction: AuditAction;
    auditUpdateAction: AuditAction;
    auditDeleteAction: AuditAction;
    auditEntityType: AuditEntityType;
    /** Sortable fields for findAllPaginated */
    sortableFields: string[];
    /** Default sort field */
    defaultSortBy: string;
    /** Relations to load in findOne */
    findOneRelations: string[];
}

/**
 * Query customization for findAllPaginated.
 * Allows concrete classes to add joins, selects, and search conditions.
 */
export interface PaginatedQueryCustomization {
    /** Add left joins and selects to the query builder */
    applyJoins(qb: any): void;
    /** Add search conditions to the brackets */
    applySearchConditions(qb: any, search: string): void;
}

/**
 * Abstract base service for plan indicators (action / indicative).
 * Eliminates duplication between ActionPlanIndicatorsService and IndicativePlanIndicatorsService.
 */
export abstract class BasePlanIndicatorsService<TIndicator> {
    protected abstract readonly logger: Logger;
    protected abstract readonly indicatorRepository: Repository<TIndicator>;
    protected abstract readonly auditLog: AuditLogService;
    protected abstract readonly config: PlanIndicatorsConfig;

    /**
     * Override to customize the paginated query (joins, search fields).
     */
    protected abstract getPaginatedQueryCustomization(): PaginatedQueryCustomization;

    async create(createDto: any): Promise<TIndicator> {
        try {
            if (createDto.code) {
                const existing = await this.indicatorRepository.findOne({ where: { code: createDto.code } as any });
                if (existing) {
                    throw new BadRequestException({ message: `El código ${createDto.code} ya existe para otro indicador.`, code: this.config.alreadyExistsCode });
                }
            }
            const indicator = this.indicatorRepository.create(createDto);
            const saved = await this.indicatorRepository.save(indicator) as TIndicator;

            const s = saved as any;
            await this.auditLog.logSuccess(this.config.auditCreateAction, this.config.auditEntityType, s.id, {
                entityName: `${s.code} - ${s.name}`,
                system: SYSTEM_NAME,
                metadata: { code: s.code, name: s.name },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = calculateSkip(page, limit);
        const { validSortBy, validSortOrder } = validateSortParams(sortBy, sortOrder, this.config.sortableFields, this.config.defaultSortBy);

        const queryBuilder = this.indicatorRepository.createQueryBuilder("i");
        const customization = this.getPaginatedQueryCustomization();
        customization.applyJoins(queryBuilder);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                customization.applySearchConditions(qb, search);
            }));
        }

        applyOrderBy(queryBuilder, "i", validSortBy, validSortOrder);
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return { data, meta: buildPaginatedMeta(total, page, limit) };
    }

    async findOne(id: string): Promise<TIndicator> {
        const indicator = await this.indicatorRepository.findOne({
            where: { id } as any,
            relations: this.config.findOneRelations,
        });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicator with ID ${id} not found`, code: this.config.notFoundCode });
        }
        return indicator;
    }

    async update(id: string, updateDto: any): Promise<TIndicator> {
        const indicator = await this.findOne(id);
        const i = indicator as any;
        const oldData = { code: i.code, name: i.name };

        if (updateDto.code) {
            const existing = await this.indicatorRepository.findOne({ where: { code: updateDto.code } as any });
            if (existing && (existing as any).id !== id) {
                throw new BadRequestException({ message: `El código ${updateDto.code} ya existe para otro indicador.`, code: this.config.alreadyExistsCode });
            }
        }
        Object.assign(indicator, updateDto);
        try {
            const saved = await this.indicatorRepository.save(indicator);

            const s = saved as any;
            await this.auditLog.logSuccess(this.config.auditUpdateAction, this.config.auditEntityType, s.id, {
                entityName: `${s.code} - ${s.name}`,
                system: SYSTEM_NAME,
                changes: buildChanges(oldData, saved, ["code", "name"]),
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const indicator = await this.findOne(id);
        const i = indicator as any;
        await this.indicatorRepository.remove(indicator);

        await this.auditLog.logSuccess(this.config.auditDeleteAction, this.config.auditEntityType, id, {
            entityName: `${i.code} - ${i.name}`,
            system: SYSTEM_NAME,
        });
    }

    protected handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        this.logger.error(error);
    }
}
