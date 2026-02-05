import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";
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
        private readonly auditLog: AuditLogService,
    ) { }

    async associate(indicatorId: string, projectId: string): Promise<ProjectActionIndicatorRelation> {
        await this.ensureIndicatorExists(indicatorId);
        await this.ensureProjectExists(projectId);

        try {
            const relation = this.relationRepository.create({
                projectId,
                indicatorId,
            });
            const saved = await this.relationRepository.save(relation);

            const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId }, select: ["id", "code", "name"] });
            const project = await this.projectRepository.findOne({ where: { id: projectId }, select: ["id", "code", "name"] });

            await this.auditLog.logSuccess(AuditAction.PROJECT_ACTION_INDICATOR_ASSOCIATED, AuditEntityType.PROJECT_ACTION_INDICATOR_RELATION, saved.id, {
                entityName: `${indicator?.code ?? indicatorId} - ${project?.code ?? projectId}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId, projectId },
            });

            return saved;
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
            throw new NotFoundException({ message: `Relation between Indicator ${indicatorId} and Project ${projectId} not found`, code: ErrorCodes.PROJECT_ACTION_INDICATOR_RELATION_NOT_FOUND });
        }

        const relationId = relation.id;
        await this.relationRepository.remove(relation);

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId }, select: ["id", "code", "name"] });
        const project = await this.projectRepository.findOne({ where: { id: projectId }, select: ["id", "code", "name"] });

        await this.auditLog.logSuccess(AuditAction.PROJECT_ACTION_INDICATOR_DISASSOCIATED, AuditEntityType.PROJECT_ACTION_INDICATOR_RELATION, relationId, {
            entityName: `${indicator?.code ?? indicatorId} - ${project?.code ?? projectId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, projectId },
        });
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
            throw new NotFoundException({ message: `Indicator with id ${indicatorId} not found`, code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }
    }

    private async ensureProjectExists(projectId: string) {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new NotFoundException({ message: `Project with id ${projectId} not found`, code: ErrorCodes.PROJECT_NOT_FOUND });
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
