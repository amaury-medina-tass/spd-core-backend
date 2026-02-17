import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { findAllPaginatedByParent } from "../../../../shared/helpers";

/**
 * Configuration for the concrete implementation of quadrenniums (indicator or variable).
 */
export interface IndicatorQuadrenniumsConfig {
    indicatorNotFoundCode?: string;
    quadrenniumNotFoundCode: string;
    auditCreateAction: AuditAction;
    auditUpdateAction: AuditAction;
    auditDeleteAction: AuditAction;
    auditEntityType: AuditEntityType;
    quadrenniumLabel: string;
    /** Parent relation name in the entity (default: "indicator") */
    parentRelation?: string;
    /** Parent ID field name in the DTO (default: "indicatorId") */
    parentIdField?: string;
    /** Whether to validate parent existence on create (default: true) */
    checkParentOnCreate?: boolean;
    /** Whether to validate the 4-year range on create/update (default: false) */
    validateYearRange?: boolean;
    /** Duplicate key error message */
    duplicateMessage?: string;
    /** Query alias for the quadrennium table (default: "q") */
    alias?: string;
    /** DB column name for startYear in search (default: "start_year") */
    startYearColumn?: string;
    /** DB column name for endYear in search (default: "end_year") */
    endYearColumn?: string;
}

/**
 * Abstract base service for quadrenniums (indicator or variable).
 * Eliminates duplication between indicator quadrenniums and variable quadrenniums services.
 */
export abstract class BaseIndicatorQuadrenniumsService<TQuadrennium, TParent = any> {
    protected abstract readonly logger: Logger;
    protected abstract readonly quadrenniumRepository: Repository<TQuadrennium>;
    protected abstract readonly auditLog: AuditLogService;
    protected abstract readonly config: IndicatorQuadrenniumsConfig;

    /** Override to provide a parent repository when checkParentOnCreate is true */
    protected readonly parentRepository?: Repository<TParent>;

    /** @deprecated Use parentRepository instead */
    protected get indicatorRepository(): Repository<TParent> | undefined {
        return this.parentRepository;
    }

    protected get quadAlias(): string {
        return this.config.alias ?? "q";
    }

    protected get parentRelation(): string {
        return this.config.parentRelation ?? "indicator";
    }

    protected get parentIdField(): string {
        return this.config.parentIdField ?? "indicatorId";
    }

    private validateYearRange(startYear: number, endYear: number): void {
        if (this.config.validateYearRange && (endYear - startYear) !== 3) {
            throw new BadRequestException("El rango de fechas debe ser de 4 años (ej: 2024-2027)");
        }
    }

    async create(createDto: any): Promise<TQuadrennium> {
        const parentId = createDto[this.parentIdField];

        this.validateYearRange(createDto.startYear, createDto.endYear);

        if (this.config.checkParentOnCreate !== false && this.parentRepository) {
            const parent = await this.parentRepository.findOne({ where: { id: parentId } as any });
            if (!parent) {
                throw new NotFoundException({ message: `Entidad con ID ${parentId} no encontrada`, code: this.config.indicatorNotFoundCode });
            }
        }

        try {
            const quadrennium = this.quadrenniumRepository.create(createDto);
            const saved = await this.quadrenniumRepository.save(quadrennium) as TQuadrennium;

            const s = saved as any;
            await this.auditLog.logSuccess(this.config.auditCreateAction, this.config.auditEntityType, s.id, {
                entityName: `${this.config.quadrenniumLabel} ${s.startYear}-${s.endYear}`,
                system: SYSTEM_NAME,
                metadata: { [this.parentIdField]: parentId, startYear: s.startYear, endYear: s.endYear, value: s.value },
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
        const alias = this.quadAlias;
        const relation = this.parentRelation;
        const startCol = this.config.startYearColumn ?? "start_year";
        const endCol = this.config.endYearColumn ?? "end_year";

        const queryBuilder = this.quadrenniumRepository
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
                        .orWhere(`${alias}.${startCol}::text ILIKE :search`, { search: `%${s}%` })
                        .orWhere(`${alias}.${endCol}::text ILIKE :search`, { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "startYear", "endYear", "value", `${relation}.code`, `${relation}.name`],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }

    async findAllByParent(parentId: string): Promise<TQuadrennium[]> {
        return this.quadrenniumRepository.find({
            where: { [this.parentIdField]: parentId } as any,
            order: { startYear: "ASC" } as any,
        });
    }

    /** @deprecated Use findAllByParent instead */
    async findAllByIndicator(parentId: string): Promise<TQuadrennium[]> {
        return this.findAllByParent(parentId);
    }

    async findOne(id: string): Promise<TQuadrennium> {
        const quadrennium = await this.quadrenniumRepository.findOne({ where: { id } as any });
        if (!quadrennium) {
            throw new NotFoundException({ message: `Quadrennium with ID ${id} not found`, code: this.config.quadrenniumNotFoundCode });
        }
        return quadrennium;
    }

    async update(id: string, updateDto: any): Promise<TQuadrennium> {
        const quadrennium = await this.quadrenniumRepository.preload({ id, ...updateDto });
        if (!quadrennium) {
            throw new NotFoundException({ message: `Quadrennium with ID ${id} not found`, code: this.config.quadrenniumNotFoundCode });
        }

        const q = quadrennium as any;
        this.validateYearRange(q.startYear, q.endYear);

        try {
            const saved = await this.quadrenniumRepository.save(quadrennium);

            const s = saved as any;
            await this.auditLog.logSuccess(this.config.auditUpdateAction, this.config.auditEntityType, s.id, {
                entityName: `${this.config.quadrenniumLabel} ${s.startYear}-${s.endYear}`,
                system: SYSTEM_NAME,
                metadata: { [this.parentIdField]: s[this.parentIdField], startYear: s.startYear, endYear: s.endYear, value: s.value },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const quadrennium = await this.quadrenniumRepository.findOne({ where: { id } as any });
        if (!quadrennium) {
            throw new NotFoundException({ message: `Quadrennium with ID ${id} not found`, code: this.config.quadrenniumNotFoundCode });
        }

        const q = quadrennium as any;
        await this.quadrenniumRepository.remove(quadrennium);

        await this.auditLog.logSuccess(this.config.auditDeleteAction, this.config.auditEntityType, id, {
            entityName: `${this.config.quadrenniumLabel} ${q.startYear}-${q.endYear}`,
            system: SYSTEM_NAME,
        });
    }

    protected handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(this.config.duplicateMessage ?? "Ya existe un cuatrienio para este indicador y rango de años.");
        }
        this.logger.error(error);
    }
}
