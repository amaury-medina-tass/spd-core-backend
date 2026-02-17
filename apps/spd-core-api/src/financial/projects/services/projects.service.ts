import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Project } from "../entities/project.entity";
import { CreateProjectDto } from "../dtos/create-project.dto";
import { DependenciesService } from "../../dependencies/services/dependencies.service";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { executeFindForSelect, findAllPaginatedByParent } from "../../../shared/helpers";

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly repo: Repository<Project>,
        private readonly dependenciesService: DependenciesService,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(dto: CreateProjectDto) {
        const dependency = await this.dependenciesService.findOne(dto.dependencyId);
        if (!dependency) {
            throw new NotFoundException({ message: `Dependencia con ID ${dto.dependencyId} no encontrada`, code: ErrorCodes.DEPENDENCY_NOT_FOUND });
        }

        const project = this.repo.create({
            code: dto.code,
            name: dto.name,
            initialBudget: dto.initialBudget,
            currentBudget: dto.currentBudget,
            execution: dto.execution,

            origin: dto.origin,
            dependency: dependency,
        });

        const saved = await this.repo.save(project);

        await this.auditLog.logSuccess(AuditAction.PROJECT_CREATED, AuditEntityType.PROJECT, saved.id, {
            entityName: `${saved.code} - ${saved.name}`,
            system: SYSTEM_NAME,
            metadata: { code: saved.code, name: saved.name, dependencyId: dto.dependencyId },
        });

        return saved;
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const queryBuilder = this.repo
            .createQueryBuilder("project")
            .leftJoin("project.dependency", "dependency")
            .addSelect(["project", "dependency.id", "dependency.code", "dependency.name"]);

        return findAllPaginatedByParent({
            queryBuilder,
            alias: "project",
            applySearch: (qb, s) => {
                qb.where(new Brackets((b) => {
                    b.where("project.code LIKE :search", { search: `%${s}%` })
                        .orWhere("project.name LIKE :search", { search: `%${s}%` })
                        .orWhere("project.origin LIKE :search", { search: `%${s}%` })
                        .orWhere("dependency.code LIKE :search", { search: `%${s}%` })
                        .orWhere("dependency.name LIKE :search", { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "code", "name", "initialBudget", "currentBudget", "execution", "origin", "state", "dependency.code", "dependency.name"],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }

    async findOne(id: string) {
        const project = await this.repo
            .createQueryBuilder("project")
            .leftJoin("project.dependency", "dependency")
            .addSelect(["project", "dependency.id", "dependency.code", "dependency.name"])
            .where("project.id = :id", { id })
            .getOne();

        if (!project) throw new NotFoundException({ message: "Proyecto no encontrado", code: ErrorCodes.PROJECT_NOT_FOUND });

        return project;
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.repo
            .createQueryBuilder("project")
            .select(["project.id", "project.code", "project.name"])
            .where("project.state = :state", { state: true });

        return executeFindForSelect({
            queryBuilder,
            applySearch: (qb, s) => {
                qb.andWhere(
                    new Brackets((b) => {
                        b.where("project.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("project.name ILIKE :search", { search: `%${s}%` });
                    })
                );
            },
            orderBy: [["project.name", "ASC"]],
            search,
            limit,
            offset,
        });
    }
}
