import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets, In } from "typeorm";
import { MgaActivity } from "../entities/mga-activity.entity";
import { MgaDetailedRelation } from "../entities/mga-detailed-relation.entity";
import { CreateMgaActivityDto } from "../dtos/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dtos/update-mga-activity.dto";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";

@Injectable()
export class MgaActivitiesService {
    private readonly logger = new Logger(MgaActivitiesService.name);

    constructor(
        @InjectRepository(MgaActivity)
        private readonly mgaActivityRepository: Repository<MgaActivity>,
        @InjectRepository(MgaDetailedRelation)
        private readonly mgaDetailedRelationRepository: Repository<MgaDetailedRelation>,
        @InjectRepository(DetailedActivity)
        private readonly detailedActivityRepository: Repository<DetailedActivity>,
    ) { }

    async create(createDto: CreateMgaActivityDto): Promise<MgaActivity> {
        try {
            const { detailedActivityIds, ...activityData } = createDto;
            const mgaActivity = this.mgaActivityRepository.create(activityData);
            const savedActivity = await this.mgaActivityRepository.save(mgaActivity);

            if (detailedActivityIds && detailedActivityIds.length > 0) {
                const relations = detailedActivityIds.map(detailedActivityId =>
                    this.mgaDetailedRelationRepository.create({
                        mgaActivityId: savedActivity.id,
                        detailedActivityId,
                    })
                );
                await this.mgaDetailedRelationRepository.save(relations);
            }

            return savedActivity;
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
            "project.code",
            "project.name",
            "product.productCode",
            "product.productName",
            "product.indicatorName",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.mgaActivityRepository
            .createQueryBuilder("mgaActivity")
            .leftJoin("mgaActivity.project", "project")
            .leftJoin("mgaActivity.product", "product")
            .addSelect([
                "mgaActivity",
                "project.id", "project.code", "project.name",
                "product.id", "product.productCode", "product.productName"
            ])
            .loadRelationCountAndMap("mgaActivity.detailedActivitiesCount", "mgaActivity.detailedRelations");

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("mgaActivity.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("mgaActivity.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("mgaActivity.observations ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.productCode ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.productName ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.indicatorName ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`mgaActivity.${validSortBy}`, validSortOrder);
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

    async findOne(id: string): Promise<MgaActivity> {
        const mgaActivity = await this.mgaActivityRepository
            .createQueryBuilder("mgaActivity")
            .leftJoin("mgaActivity.project", "project")
            .leftJoin("mgaActivity.product", "product")
            .addSelect([
                "mgaActivity",
                "project.id", "project.code", "project.name",
                "product.id", "product.productCode", "product.productName"
            ])
            .loadRelationCountAndMap("mgaActivity.detailedActivitiesCount", "mgaActivity.detailedRelations")
            .where("mgaActivity.id = :id", { id })
            .getOne();

        if (!mgaActivity) {
            throw new NotFoundException(`MGA Activity with id ${id} not found`);
        }

        return mgaActivity;
    }

    async update(id: string, updateDto: UpdateMgaActivityDto): Promise<MgaActivity> {
        const mgaActivity = await this.mgaActivityRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!mgaActivity) {
            throw new NotFoundException(`MGA Activity with id ${id} not found`);
        }

        try {
            await this.mgaActivityRepository.save(mgaActivity);
            return this.findOne(id);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async addDetailedRelation(mgaActivityId: string, detailedActivityId: string): Promise<MgaDetailedRelation> {
        // Verify MGA activity exists
        await this.findOne(mgaActivityId);

        try {
            const relation = this.mgaDetailedRelationRepository.create({
                mgaActivityId,
                detailedActivityId,
            });
            return await this.mgaDetailedRelationRepository.save(relation);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async removeDetailedRelation(mgaActivityId: string, detailedActivityId: string): Promise<void> {
        const relation = await this.mgaDetailedRelationRepository.findOne({
            where: { mgaActivityId, detailedActivityId },
        });

        if (!relation) {
            throw new NotFoundException(`Relation between MGA Activity ${mgaActivityId} and Detailed Activity ${detailedActivityId} not found`);
        }

        await this.mgaDetailedRelationRepository.remove(relation);
    }

    async getDetailedRelations(mgaActivityId: string): Promise<MgaDetailedRelation[]> {
        await this.findOne(mgaActivityId);

        return this.mgaDetailedRelationRepository.find({
            where: { mgaActivityId },
            relations: ["detailedActivity"],
        });
    }

    async getAssociatedActivities(
        id: string,
        limit: number = 20,
        offset: number = 0,
        search?: string
    ) {
        await this.findOne(id);

        const query = this.mgaDetailedRelationRepository
            .createQueryBuilder("relation")
            .leftJoinAndSelect("relation.detailedActivity", "detailedActivity")
            .leftJoin("detailedActivity.rubric", "rubric")
            .leftJoin("detailedActivity.project", "project")
            .addSelect(["rubric.id", "rubric.code", "rubric.accountName", "project.id", "project.code", "project.name"])
            .where("relation.mgaActivityId = :id", { id });

        if (search) {
            query.andWhere(new Brackets((qb) => {
                qb.where("detailedActivity.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [relations, total] = await query
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        const data = relations.map(r => r.detailedActivity);
        const page = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
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

    async getAvailableActivities(
        id: string,
        limit: number = 20,
        offset: number = 0,
        search?: string
    ) {
        await this.findOne(id);

        const associatedIds = (await this.mgaDetailedRelationRepository.find({
            where: { mgaActivityId: id },
            select: ["detailedActivityId"]
        })).map(r => r.detailedActivityId);

        const query = this.detailedActivityRepository.createQueryBuilder("da")
            .leftJoin("da.rubric", "rubric")
            .leftJoin("da.project", "project")
            .addSelect(["da", "rubric.id", "rubric.code", "rubric.accountName", "project.id", "project.code", "project.name"]);

        if (associatedIds.length > 0) {
            query.where("da.id NOT IN (:...ids)", { ids: associatedIds });
        }

        if (search) {
            const searchMethod = associatedIds.length > 0 ? "andWhere" : "where";
            query[searchMethod](new Brackets((qb) => {
                qb.where("da.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("da.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [data, total] = await query
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        const page = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
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

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(error.detail);
        }
        this.logger.error(error);
    }
}
