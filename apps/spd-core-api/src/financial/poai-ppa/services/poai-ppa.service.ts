import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { PoaiPpa } from "../entities/poai-ppa.entity";
import { CreatePoaiPpaDto } from "../dtos/create-poai-ppa.dto";
import { UpdatePoaiPpaDto } from "../dtos/update-poai-ppa.dto";
import { ProjectsService } from "../../projects/services/projects.service";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class PoaiPpaService {
    constructor(
        @InjectRepository(PoaiPpa)
        private readonly repo: Repository<PoaiPpa>,
        private readonly projectsService: ProjectsService,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(dto: CreatePoaiPpaDto) {
        const project = await this.projectsService.findOne(dto.projectId);

        // Check if a record already exists for this project and year
        const existing = await this.repo.findOne({
            where: { project: { id: dto.projectId }, year: dto.year }
        });

        if (existing) {
            throw new ConflictException({
                message: `Ya existe un registro POAI PPA para el proyecto ${project.code} en el año ${dto.year}`,
                code: ErrorCodes.POAI_PPA_ALREADY_EXISTS,
            });
        }

        const poaiPpa = this.repo.create({
            project,
            projectCode: dto.projectCode || project.code,
            year: dto.year,
            projectedPoai: dto.projectedPoai || 0,
            assignedPoai: dto.assignedPoai || 0,
        });

        const saved = await this.repo.save(poaiPpa);

        await this.auditLog.logSuccess(AuditAction.POAI_PPA_CREATED, AuditEntityType.POAI_PPA, saved.id, {
            entityName: `${saved.projectCode} - ${saved.year}`,
            system: SYSTEM_NAME,
            metadata: { projectCode: saved.projectCode, year: saved.year, projectedPoai: saved.projectedPoai, assignedPoai: saved.assignedPoai },
        });

        return {
            id: saved.id,
            projectId: project.id,
            projectCode: saved.projectCode,
            year: saved.year,
            projectedPoai: saved.projectedPoai,
            assignedPoai: saved.assignedPoai,
            createAt: saved.createAt,
            updateAt: saved.updateAt,
        };
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
        year?: number,
        projectId?: string
    ) {
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "year",
            "projectedPoai",
            "assignedPoai",
            "projectCode",
            "project.code",
            "project.name"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "year";

        const queryBuilder = this.repo
            .createQueryBuilder("poaiPpa")
            .leftJoin("poaiPpa.project", "project")
            .addSelect(["poaiPpa", "project.id", "project.code", "project.name"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("poaiPpa.projectCode ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("CAST(poaiPpa.year AS TEXT) ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (year) {
            queryBuilder.andWhere("poaiPpa.year = :year", { year });
        }

        if (projectId) {
            queryBuilder.andWhere("project.id = :projectId", { projectId });
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`poaiPpa.${validSortBy}`, validSortOrder);
        }

        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string) {
        const poaiPpa = await this.repo
            .createQueryBuilder("poaiPpa")
            .leftJoin("poaiPpa.project", "project")
            .addSelect(["poaiPpa", "project.id", "project.code", "project.name"])
            .where("poaiPpa.id = :id", { id })
            .getOne();

        if (!poaiPpa) throw new NotFoundException({ message: "Registro POAI PPA no encontrado", code: ErrorCodes.POAI_PPA_NOT_FOUND });

        return poaiPpa;
    }

    async update(id: string, dto: UpdatePoaiPpaDto) {
        const poaiPpa = await this.findOne(id);
        const oldData = { year: poaiPpa.year, projectCode: poaiPpa.projectCode, projectedPoai: poaiPpa.projectedPoai, assignedPoai: poaiPpa.assignedPoai };

        // If projectId is being updated, validate it exists
        if (dto.projectId && dto.projectId !== poaiPpa.project.id) {
            const newProject = await this.projectsService.findOne(dto.projectId);

            // Check for duplicate (project + year)
            const existing = await this.repo.findOne({
                where: {
                    project: { id: dto.projectId },
                    year: dto.year || poaiPpa.year
                }
            });

            if (existing && existing.id !== id) {
                throw new ConflictException({
                    message: `Ya existe un registro POAI PPA para el proyecto ${newProject.code} en el año ${dto.year || poaiPpa.year}`,
                    code: ErrorCodes.POAI_PPA_ALREADY_EXISTS,
                });
            }

            poaiPpa.project = newProject;
            poaiPpa.projectCode = dto.projectCode || newProject.code;
        }

        // Check if only year is being updated
        if (dto.year && dto.year !== poaiPpa.year && !dto.projectId) {
            const existing = await this.repo.findOne({
                where: {
                    project: { id: poaiPpa.project.id },
                    year: dto.year
                }
            });

            if (existing && existing.id !== id) {
                throw new ConflictException({
                    message: `Ya existe un registro POAI PPA para el proyecto ${poaiPpa.projectCode} en el año ${dto.year}`,
                    code: ErrorCodes.POAI_PPA_ALREADY_EXISTS,
                });
            }
        }

        if (dto.year !== undefined) poaiPpa.year = dto.year;
        if (dto.projectCode !== undefined) poaiPpa.projectCode = dto.projectCode;
        if (dto.projectedPoai !== undefined) poaiPpa.projectedPoai = dto.projectedPoai;
        if (dto.assignedPoai !== undefined) poaiPpa.assignedPoai = dto.assignedPoai;

        const saved = await this.repo.save(poaiPpa);

        await this.auditLog.logSuccess(AuditAction.POAI_PPA_UPDATED, AuditEntityType.POAI_PPA, saved.id, {
            entityName: `${saved.projectCode} - ${saved.year}`,
            system: SYSTEM_NAME,
            changes: buildChanges(oldData, saved, ["year", "projectCode", "projectedPoai", "assignedPoai"]),
        });

        return saved;
    }

    async remove(id: string) {
        const poaiPpa = await this.findOne(id);
        await this.repo.remove(poaiPpa);

        await this.auditLog.logSuccess(AuditAction.POAI_PPA_DELETED, AuditEntityType.POAI_PPA, id, {
            entityName: `${poaiPpa.projectCode} - ${poaiPpa.year}`,
            system: SYSTEM_NAME,
        });

        return { message: "Registro POAI PPA eliminado exitosamente" };
    }

    async findByProjectAndYear(projectId: string, year: number) {
        const poaiPpa = await this.repo
            .createQueryBuilder("poaiPpa")
            .leftJoin("poaiPpa.project", "project")
            .addSelect(["poaiPpa", "project.id", "project.code", "project.name"])
            .where("project.id = :projectId", { projectId })
            .andWhere("poaiPpa.year = :year", { year })
            .getOne();

        if (!poaiPpa) {
            throw new NotFoundException({
                message: `No se encontró registro POAI PPA para el proyecto y año especificados`,
                code: ErrorCodes.POAI_PPA_NOT_FOUND,
            });
        }

        return poaiPpa;
    }

    /**
     * Comparativa de TODOS los años de un proyecto
     * Útil para gráficas de barras comparativas
     */
    async findYearComparisonByProject(projectId: string) {
        // Validate project exists
        await this.projectsService.findOne(projectId);

        const data = await this.repo
            .createQueryBuilder("poaiPpa")
            .leftJoin("poaiPpa.project", "project")
            .addSelect(["poaiPpa", "project.id", "project.code", "project.name"])
            .where("project.id = :projectId", { projectId })
            .orderBy("poaiPpa.year", "ASC")
            .getMany();

        return {
            data,
            summary: {
                totalYears: data.length,
                years: data.map(d => d.year),
                totalProjected: data.reduce((sum, d) => sum + Number(d.projectedPoai || 0), 0),
                totalAssigned: data.reduce((sum, d) => sum + Number(d.assignedPoai || 0), 0),
            }
        };
    }

    /**
     * Resumen con totales y promedios para gráficas
     */
    async getBudgetSummaryByProject(projectId: string) {
        // Validate project exists
        const project = await this.projectsService.findOne(projectId);

        const result = await this.repo
            .createQueryBuilder("poaiPpa")
            .select([
                "COUNT(*)::int as \"yearCount\"",
                "COALESCE(SUM(poaiPpa.projected_poai), 0)::numeric as \"totalProjected\"",
                "COALESCE(SUM(poaiPpa.assigned_poai), 0)::numeric as \"totalAssigned\"",
                "COALESCE(AVG(poaiPpa.projected_poai), 0)::numeric as \"avgProjected\"",
                "COALESCE(AVG(poaiPpa.assigned_poai), 0)::numeric as \"avgAssigned\"",
                "MIN(poaiPpa.year)::int as \"minYear\"",
                "MAX(poaiPpa.year)::int as \"maxYear\""
            ])
            .where("poaiPpa.project_id = :projectId", { projectId })
            .getRawOne();

        return {
            project: {
                id: project.id,
                code: project.code,
                name: project.name,
            },
            summary: {
                yearCount: Number(result?.yearCount || 0),
                totalProjected: Number(result?.totalProjected || 0),
                totalAssigned: Number(result?.totalAssigned || 0),
                avgProjected: Math.round(Number(result?.avgProjected || 0) * 100) / 100,
                avgAssigned: Math.round(Number(result?.avgAssigned || 0) * 100) / 100,
                minYear: result?.minYear || null,
                maxYear: result?.maxYear || null,
                executionRate: result?.totalProjected > 0
                    ? Math.round((Number(result.totalAssigned) / Number(result.totalProjected)) * 10000) / 100
                    : 0
            }
        };
    }

    /**
     * Evolución del presupuesto proyectado vs asignado por año
     * Ideal para gráficas de líneas
     */
    async getProjectBudgetEvolution(projectId: string) {
        // Validate project exists
        const project = await this.projectsService.findOne(projectId);

        const data = await this.repo
            .createQueryBuilder("poaiPpa")
            .select([
                "poaiPpa.year as year",
                "poaiPpa.projected_poai as \"projectedPoai\"",
                "poaiPpa.assigned_poai as \"assignedPoai\""
            ])
            .where("poaiPpa.project_id = :projectId", { projectId })
            .orderBy("poaiPpa.year", "ASC")
            .getRawMany();

        // Calculate year-over-year changes
        const evolution = data.map((item, index) => {
            const projected = Number(item.projectedPoai || 0);
            const assigned = Number(item.assignedPoai || 0);
            const prevItem = index > 0 ? data[index - 1] : null;

            return {
                year: item.year,
                projectedPoai: projected,
                assignedPoai: assigned,
                variance: projected - assigned,
                variancePercentage: projected > 0
                    ? Math.round(((projected - assigned) / projected) * 10000) / 100
                    : 0,
                yoyProjectedChange: prevItem
                    ? Math.round((projected - Number(prevItem.projectedPoai || 0)) * 100) / 100
                    : null,
                yoyAssignedChange: prevItem
                    ? Math.round((assigned - Number(prevItem.assignedPoai || 0)) * 100) / 100
                    : null,
            };
        });

        return {
            project: {
                id: project.id,
                code: project.code,
                name: project.name,
            },
            evolution
        };
    }

    /**
     * Tendencias anuales globales (todos los proyectos)
     * Ideal para dashboard general
     */
    async getYearlyTrends(startYear?: number, endYear?: number) {
        const queryBuilder = this.repo
            .createQueryBuilder("poaiPpa")
            .select([
                "poaiPpa.year as year",
                "COUNT(DISTINCT poaiPpa.project_id)::int as \"projectCount\"",
                "COALESCE(SUM(poaiPpa.projected_poai), 0)::numeric as \"totalProjected\"",
                "COALESCE(SUM(poaiPpa.assigned_poai), 0)::numeric as \"totalAssigned\"",
                "COALESCE(AVG(poaiPpa.projected_poai), 0)::numeric as \"avgProjected\"",
                "COALESCE(AVG(poaiPpa.assigned_poai), 0)::numeric as \"avgAssigned\""
            ])
            .groupBy("poaiPpa.year")
            .orderBy("poaiPpa.year", "ASC");

        if (startYear) {
            queryBuilder.andWhere("poaiPpa.year >= :startYear", { startYear });
        }

        if (endYear) {
            queryBuilder.andWhere("poaiPpa.year <= :endYear", { endYear });
        }

        const rawData = await queryBuilder.getRawMany();

        const data = rawData.map(item => ({
            year: item.year,
            projectCount: Number(item.projectCount || 0),
            totalProjected: Number(item.totalProjected || 0),
            totalAssigned: Number(item.totalAssigned || 0),
            avgProjected: Math.round(Number(item.avgProjected || 0) * 100) / 100,
            avgAssigned: Math.round(Number(item.avgAssigned || 0) * 100) / 100,
            executionRate: Number(item.totalProjected) > 0
                ? Math.round((Number(item.totalAssigned) / Number(item.totalProjected)) * 10000) / 100
                : 0
        }));

        return {
            data,
            meta: {
                totalYears: data.length,
                yearRange: data.length > 0
                    ? { start: data[0].year, end: data.at(-1)!.year }
                    : null
            }
        };
    }
}
