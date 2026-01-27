import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { ProjectActionIndicatorRelation } from "../../entities/action-plan/project-action-indicator-relation.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { Project } from "../../../../financial/projects/entities/project.entity";

@Injectable()
export class ProjectActionIndicatorRelationsService {
    private readonly logger = new Logger(ProjectActionIndicatorRelationsService.name);

    constructor(
        @InjectRepository(ProjectActionIndicatorRelation)
        private readonly relationRepository: Repository<ProjectActionIndicatorRelation>,
        @InjectRepository(ActionPlanIndicator)
        private readonly indicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) { }

    async associate(indicatorId: string, projectId: string): Promise<ProjectActionIndicatorRelation> {
        await this.ensureIndicatorExists(indicatorId);
        await this.ensureProjectExists(projectId);

        try {
            const relation = this.relationRepository.create({
                projectId,
                indicatorId,
            });
            return await this.relationRepository.save(relation);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async disassociate(indicatorId: string, projectId: string): Promise<void> {
        const relation = await this.relationRepository.findOne({
            where: { projectId, indicatorId },
        });

        if (!relation) {
            throw new NotFoundException(`Relation between Indicator ${indicatorId} and Project ${projectId} not found`);
        }

        await this.relationRepository.remove(relation);
    }

    async findPaginated(
        indicatorId: string,
        type: "associated" | "available" | "all" = "all",
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        await this.ensureIndicatorExists(indicatorId);
        const skip = (page - 1) * limit;

        const associatedIds = (await this.relationRepository.find({
            where: { indicatorId },
            select: ["projectId"]
        })).map(r => r.projectId);

        const query = this.projectRepository.createQueryBuilder("project");

        if (type === "associated") {
            if (associatedIds.length === 0) {
                return this.emptyPaginatedResponse(page, limit);
            }
            query.where("project.id IN (:...ids)", { ids: associatedIds });
        } else if (type === "available") {
            if (associatedIds.length > 0) {
                query.where("project.id NOT IN (:...ids)", { ids: associatedIds });
            }
        }

        if (search) {
            query.andWhere(new Brackets((qb) => {
                qb.where("project.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [data, total] = await query
            .orderBy("project.code", "ASC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        const enrichedData = type === "all"
            ? data.map(item => ({ ...item, isAssociated: associatedIds.includes(item.id) }))
            : data;

        return {
            data: enrichedData,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    private async ensureIndicatorExists(indicatorId: string) {
        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicator with id ${indicatorId} not found`);
        }
    }

    private async ensureProjectExists(projectId: string) {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new NotFoundException(`Project with id ${projectId} not found`);
        }
    }

    private emptyPaginatedResponse(page: number, limit: number) {
        return {
            data: [],
            meta: {
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("The project is already associated with this indicator.");
        }
        this.logger.error(error);
    }
}
