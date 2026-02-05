import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets, In } from "typeorm";
import { MgaActivity } from "../entities/mga-activity.entity";
import { MgaDetailedRelation } from "../entities/mga-detailed-relation.entity";
import { CreateMgaActivityDto } from "../dtos/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dtos/update-mga-activity.dto";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

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
        private readonly auditLog: AuditLogService,
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

            await this.auditLog.logSuccess(AuditAction.MGA_ACTIVITY_CREATED, AuditEntityType.MGA_ACTIVITY, savedActivity.id, {
                entityName: `${savedActivity.code} - ${savedActivity.name}`,
                system: SYSTEM_NAME,
                metadata: { code: savedActivity.code, name: savedActivity.name },
            });

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
        // Si el usuario pide ordenar por valor o saldo, lo manejaremos en el QueryBuilder
        // Nota: "value" y "balance" son campos calculados
        const validSortBy =
            sortBy && (sortableFields.includes(sortBy) || sortBy === "value" || sortBy === "balance") ? sortBy : "createAt";

        const queryBuilder = this.mgaActivityRepository
            .createQueryBuilder("mgaActivity")
            .leftJoin("mgaActivity.project", "project")
            .leftJoin("mgaActivity.product", "product")
            // Joins para calcular totales
            .leftJoin("mgaActivity.detailedRelations", "rel")
            .leftJoin("rel.detailedActivity", "da")
            .select([
                "mgaActivity.id", "mgaActivity.code", "mgaActivity.name",
                "mgaActivity.observations", "mgaActivity.createAt", "mgaActivity.updateAt",
                "project.id", "project.code", "project.name",
                "product.id", "product.productCode", "product.productName"
            ])
            // Agregaciones para valor y saldo
            .addSelect("COALESCE(SUM(da.budget_ceiling), 0)", "totalValue")
            .addSelect("COALESCE(SUM(da.balance), 0)", "totalBalance")
            .groupBy("mgaActivity.id")
            .addGroupBy("project.id")
            .addGroupBy("product.id")

            .loadRelationCountAndMap("mgaActivity.detailedActivitiesCount", "mgaActivity.detailedRelations");

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
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

        // Manejo del ordenamiento
        if (validSortBy === "value") {
            queryBuilder.orderBy("totalValue", validSortOrder);
        } else if (validSortBy === "balance") {
            queryBuilder.orderBy("totalBalance", validSortOrder);
        } else if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`mgaActivity.${validSortBy}`, validSortOrder);
        }

        queryBuilder.offset(skip).limit(limit);

        // Usamos getRawMany para obtener los valores calculados
        const rawData = await queryBuilder.getRawMany();

        // Necesitamos el conteo total para la paginación. 
        // Como usamos GROUP BY, getCount() puede no ser preciso directamenet, 
        // pero en versiones recientes de TypeORM suele manejarlo. 
        // Hacemos una query separada por seguridad y limpieza con los joins de agregación.
        const countQuery = this.mgaActivityRepository.createQueryBuilder("mgaActivity")
            .leftJoin("mgaActivity.project", "project")
            .leftJoin("mgaActivity.product", "product");

        if (search) {
            countQuery.where(new Brackets((qb) => {
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

        const total = await countQuery.getCount();

        // Mapeamos los resultados raw a la estructura esperada
        // Nota: getRawMany aplana la estructura, así que reconstruimos los objetos
        const data = rawData.map(row => ({
            id: row.mgaActivity_id,
            code: row.mgaActivity_code,
            name: row.mgaActivity_name,
            observations: row.mgaActivity_observations,
            activityDate: row.mgaActivity_activity_date,
            createAt: row.mgaActivity_create_at,
            updateAt: row.mgaActivity_update_at,
            detailedActivitiesCount: 0, // Se perderá el loadRelationCountAndMap con getRawMany, podemos hacer count o dejarlo si no es crítico, o re-calcular
            project: {
                id: row.project_id,
                code: row.project_code,
                name: row.project_name
            },
            product: {
                id: row.product_id,
                productCode: row.product_product_code,
                productName: row.product_product_name
            },
            value: Number(row.totalValue),
            balance: Number(row.totalBalance)
        }));

        // Recuperar el count de relaciones detalladas que se pierde con getRawMany
        // Una opción eficiente es hacerlo en la misma query con COUNT(DISTINCT rel.id)
        // Ajustamos la query principal para incluirlo

        // RE-AJUSTE PARA INCLUIR COUNT DE DETALLES Y MANTENER LA ESTRUCTURA DE RESPUESTA
        const finalData = await Promise.all(data.map(async (item) => {
            const count = await this.mgaDetailedRelationRepository.count({ where: { mgaActivityId: item.id } });
            item.detailedActivitiesCount = count;
            return item;
        }));


        const totalPages = Math.ceil(total / limit);

        return {
            data: finalData,
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

    async findOne(
        id: string,
        activityPage: number = 1,
        activityLimit: number = 10,
        activitySearch?: string
    ) {
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
            throw new NotFoundException({ message: `MGA Activity with id ${id} not found`, code: ErrorCodes.MGA_ACTIVITY_NOT_FOUND });
        }

        // Calcular valor y saldo totales
        const totalsResult = await this.mgaDetailedRelationRepository
            .createQueryBuilder("rel")
            .leftJoin("detailed_activities", "da", "rel.detailed_activity_id = da.id")
            .select([
                "COALESCE(SUM(da.budget_ceiling), 0) AS \"totalValue\"",
                "COALESCE(SUM(da.balance), 0) AS \"totalBalance\""
            ])
            .where("rel.mga_activity_id = :id", { id })
            .getRawOne();

        // Query para obtener las actividades detalladas paginadas
        const activitySkip = (activityPage - 1) * activityLimit;

        const activityQuery = this.mgaDetailedRelationRepository
            .createQueryBuilder("rel")
            .leftJoin("detailed_activities", "da", "rel.detailed_activity_id = da.id")
            .leftJoin("rubrics", "r", "da.rubric_id = r.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            .select([
                "rel.id AS \"id\"",
                "da.id AS \"detailedActivityId\"",
                "da.code AS \"activityCode\"",
                "da.name AS \"activityName\"",
                "p.code AS \"projectCode\"",
                "r.code AS \"rubricCode\"",
                "COALESCE(da.budget_ceiling, 0) AS \"value\"",
                "COALESCE(da.balance, 0) AS \"balance\""
            ])
            .where("rel.mga_activity_id = :id", { id });

        // Aplicar búsqueda si existe
        if (activitySearch) {
            activityQuery.andWhere(new Brackets((qb) => {
                qb.where("da.code ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("da.name ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${activitySearch}%` });
            }));
        }

        // Obtener el total para paginación
        const activityCountQuery = this.mgaDetailedRelationRepository
            .createQueryBuilder("rel")
            .leftJoin("detailed_activities", "da", "rel.detailed_activity_id = da.id")
            .leftJoin("rubrics", "r", "da.rubric_id = r.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            .select("COUNT(rel.id)", "count")
            .where("rel.mga_activity_id = :id", { id });

        if (activitySearch) {
            activityCountQuery.andWhere(new Brackets((qb) => {
                qb.where("da.code ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("da.name ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${activitySearch}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${activitySearch}%` });
            }));
        }

        const activityCountResult = await activityCountQuery.getRawOne();
        const activityTotal = activityCountResult ? parseInt(activityCountResult.count, 10) : 0;

        const detailedActivitiesResult = await activityQuery
            .orderBy("da.code", "ASC")
            .offset(activitySkip)
            .limit(activityLimit)
            .getRawMany();

        const detailedActivitiesData = detailedActivitiesResult.map(item => ({
            id: item.id,
            detailedActivityId: item.detailedActivityId,
            activityCode: item.activityCode,
            activityName: item.activityName,
            projectCode: item.projectCode,
            rubricCode: item.rubricCode,
            value: Number(item.value) || 0,
            balance: Number(item.balance) || 0,
        }));

        const activityTotalPages = Math.ceil(activityTotal / activityLimit);

        return {
            id: mgaActivity.id,
            code: mgaActivity.code,
            name: mgaActivity.name,
            observations: mgaActivity.observations,
            activityDate: mgaActivity.activityDate,
            createAt: mgaActivity.createAt,
            updateAt: mgaActivity.updateAt,
            project: mgaActivity.project,
            product: mgaActivity.product,
            detailedActivitiesCount: activityTotal,
            value: Number(totalsResult?.totalValue) || 0,
            balance: Number(totalsResult?.totalBalance) || 0,
            detailedActivities: {
                data: detailedActivitiesData,
                meta: {
                    total: activityTotal,
                    page: activityPage,
                    limit: activityLimit,
                    totalPages: activityTotalPages,
                    hasNextPage: activityPage < activityTotalPages,
                    hasPreviousPage: activityPage > 1,
                }
            },
        };
    }

    async update(id: string, updateDto: UpdateMgaActivityDto) {
        const oldMga = await this.findOne(id);
        const oldData = { code: oldMga.code, name: oldMga.name, observations: oldMga.observations };

        const mgaActivity = await this.mgaActivityRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!mgaActivity) {
            throw new NotFoundException({ message: `MGA Activity with id ${id} not found`, code: ErrorCodes.MGA_ACTIVITY_NOT_FOUND });
        }

        try {
            await this.mgaActivityRepository.save(mgaActivity);
            const result = await this.findOne(id);

            await this.auditLog.logSuccess(AuditAction.MGA_ACTIVITY_UPDATED, AuditEntityType.MGA_ACTIVITY, id, {
                entityName: `${mgaActivity.code} - ${mgaActivity.name}`,
                system: SYSTEM_NAME,
                changes: buildChanges(oldData, mgaActivity, ["code", "name", "observations"]),
            });

            return result;
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

    async getDetailedActivitiesForMga(
        id: string,
        type: "associated" | "available" | "all" = "all",
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        const mgaActivity = await this.findOne(id);
        const skip = (page - 1) * limit;

        const associatedIds = (await this.mgaDetailedRelationRepository.find({
            where: { mgaActivityId: id },
            select: ["detailedActivityId"]
        })).map(r => r.detailedActivityId);

        const query = this.detailedActivityRepository.createQueryBuilder("da")
            .leftJoin("da.rubric", "rubric")
            .leftJoin("da.project", "project")
            .addSelect(["da", "rubric.id", "rubric.code", "rubric.accountName", "project.id", "project.code", "project.name"])
            .where("da.projectId = :projectId", { projectId: mgaActivity.project?.id });

        if (type === "associated") {
            if (associatedIds.length === 0) {
                return this.emptyPaginatedResponse(page, limit);
            }
            query.andWhere("da.id IN (:...ids)", { ids: associatedIds });
        } else if (type === "available") {
            if (associatedIds.length > 0) {
                query.andWhere("da.id NOT IN (:...ids)", { ids: associatedIds });
            }
        }

        if (search) {
            query.andWhere(new Brackets((qb) => {
                qb.where("da.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("da.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [data, total] = await query
            .orderBy("da.code", "ASC")
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
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        this.logger.error(error);
    }
}
