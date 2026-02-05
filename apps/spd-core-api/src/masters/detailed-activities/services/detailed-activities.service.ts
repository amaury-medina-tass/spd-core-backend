import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { DetailedActivity } from "../entities/detailed-activity.entity";
import { CreateDetailedActivityDto } from "../dtos/create-detailed-activity.dto";
import { UpdateDetailedActivityDto } from "../dtos/update-detailed-activity.dto";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class DetailedActivitiesService {
    private readonly logger = new Logger(DetailedActivitiesService.name);

    constructor(
        @InjectRepository(DetailedActivity)
        private readonly detailedActivityRepository: Repository<DetailedActivity>,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(createDto: CreateDetailedActivityDto): Promise<DetailedActivity> {
        try {
            const detailedActivity = this.detailedActivityRepository.create(createDto);
            const saved = await this.detailedActivityRepository.save(detailedActivity);

            await this.auditLog.logSuccess(AuditAction.DETAILED_ACTIVITY_CREATED, AuditEntityType.DETAILED_ACTIVITY, saved.id, {
                entityName: `${saved.code} - ${saved.name}`,
                system: SYSTEM_NAME,
                metadata: { code: saved.code, name: saved.name },
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
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "code",
            "name",
            "observations",
            "activityDate",
            "budgetCeiling",
            "balance",
            "cpc",
            "project.code",
            "project.name",
            "rubric.code",
            "rubric.accountName"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.detailedActivityRepository
            .createQueryBuilder("detailedActivity")
            .leftJoin("detailedActivity.project", "project")
            .leftJoin("detailedActivity.rubric", "rubric")
            .addSelect(["detailedActivity", "project.id", "project.code", "project.name", "rubric.id", "rubric.code", "rubric.accountName"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("detailedActivity.code LIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.name LIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.observations LIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.activityDate::text LIKE :search", { search: `%${search}%` })
                    .orWhere("project.code LIKE :search", { search: `%${search}%` })
                    .orWhere("project.name LIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code LIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.accountName LIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`detailedActivity.${validSortBy}`, validSortOrder);
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

    async findOne(id: string): Promise<DetailedActivity> {
        const detailedActivity = await this.detailedActivityRepository.findOne({
            where: { id },
            relations: ["project", "rubric"],
        });

        if (!detailedActivity) {
            throw new NotFoundException({ message: `Detailed Activity with id ${id} not found`, code: ErrorCodes.DETAILED_ACTIVITY_NOT_FOUND });
        }

        return detailedActivity;
    }

    async update(id: string, updateDto: UpdateDetailedActivityDto): Promise<DetailedActivity> {
        const oldActivity = await this.findOne(id);
        const oldData = { code: oldActivity.code, name: oldActivity.name, observations: oldActivity.observations };

        const detailedActivity = await this.detailedActivityRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!detailedActivity) {
            throw new NotFoundException({ message: `Detailed Activity with id ${id} not found`, code: ErrorCodes.DETAILED_ACTIVITY_NOT_FOUND });
        }

        try {
            const saved = await this.detailedActivityRepository.save(detailedActivity);

            await this.auditLog.logSuccess(AuditAction.DETAILED_ACTIVITY_UPDATED, AuditEntityType.DETAILED_ACTIVITY, saved.id, {
                entityName: `${saved.code} - ${saved.name}`,
                system: SYSTEM_NAME,
                changes: buildChanges(oldData, saved, ["code", "name", "observations"]),
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const detailedActivity = await this.findOne(id);
        await this.detailedActivityRepository.remove(detailedActivity);

        await this.auditLog.logSuccess(AuditAction.DETAILED_ACTIVITY_DELETED, AuditEntityType.DETAILED_ACTIVITY, id, {
            entityName: `${detailedActivity.code} - ${detailedActivity.name}`,
            system: SYSTEM_NAME,
        });
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        this.logger.error(error);
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.detailedActivityRepository
            .createQueryBuilder("detailedActivity")
            .leftJoin("detailedActivity.project", "project")
            .leftJoin("detailedActivity.rubric", "rubric")
            .select([
                "detailedActivity.id",
                "detailedActivity.code",
                "detailedActivity.name",
                "detailedActivity.observations",
                "detailedActivity.cpc",
                "detailedActivity.budgetCeiling",
                "detailedActivity.balance",
                "detailedActivity.createAt",
                "project.code",
                "rubric.code"
            ]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("detailedActivity.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("detailedActivity.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("project.code ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("detailedActivity.createAt", "DESC")
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
