import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Project } from "../entities/project.entity";
import { CreateProjectDto } from "../dtos/create-project.dto";
import { DependenciesService } from "../../dependencies/services/dependencies.service";

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private repo: Repository<Project>,
        private dependenciesService: DependenciesService
    ) { }

    async create(dto: CreateProjectDto) {
        const dependency = await this.dependenciesService.findOne(dto.dependencyId);
        if (!dependency) {
            throw new NotFoundException(`Dependencia con ID ${dto.dependencyId} no encontrada`);
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

        return this.repo.save(project);
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "code",
            "name",
            "initialBudget",
            "currentBudget",
            "execution",

            "origin",
            "state",
            "dependency.code",
            "dependency.name"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.repo
            .createQueryBuilder("project")
            .leftJoin("project.dependency", "dependency")
            .addSelect(["project", "dependency.id", "dependency.code", "dependency.name"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("project.code LIKE :search", { search: `%${search}%` })
                    .orWhere("project.name LIKE :search", { search: `%${search}%` })
                    .orWhere("project.origin LIKE :search", { search: `%${search}%` })
                    .orWhere("dependency.code LIKE :search", { search: `%${search}%` })
                    .orWhere("dependency.name LIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`project.${validSortBy}`, validSortOrder);
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
        const project = await this.repo
            .createQueryBuilder("project")
            .leftJoin("project.dependency", "dependency")
            .addSelect(["project", "dependency.id", "dependency.code", "dependency.name"])
            .where("project.id = :id", { id })
            .getOne();

        if (!project) throw new NotFoundException("Proyecto no encontrado");

        return project;
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.repo
            .createQueryBuilder("project")
            .select(["project.id", "project.code", "project.name"])
            .where("project.state = :state", { state: true });

        if (search) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where("project.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("project.name ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("project.name", "ASC")
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + data.length < total,
            },
        };
    }
}
