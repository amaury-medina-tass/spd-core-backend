import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { CdpPosition } from "../entities/cdp-position.entity";
import { CdpPositionFunding } from "../entities/cdp-position-funding.entity";
import { DetailedActivity } from "../../../masters/detailed-activities/entities/detailed-activity.entity";
import { CdpTableRowDto } from "../dtos/cdp-table-row.dto";

@Injectable()
export class CdpPositionsService {
    constructor(
        @InjectRepository(CdpPosition)
        private repo: Repository<CdpPosition>,
        @InjectRepository(CdpPositionFunding)
        private fundingRepo: Repository<CdpPositionFunding>,
        @InjectRepository(DetailedActivity)
        private detailedActivityRepo: Repository<DetailedActivity>,
    ) { }

    async findByCdpId(cdpId: string, search?: string) {
        const queryBuilder = this.repo
            .createQueryBuilder("position")
            .leftJoin("position.rubric", "rubric")
            .addSelect([
                "position",
                "rubric.id", "rubric.code", "rubric.accountName"
            ])
            .where("position.cdp_id = :cdpId", { cdpId });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("position.positionNumber ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.accountName ILIKE :search", { search: `%${search}%` });
            }));
        }

        return queryBuilder
            .orderBy("position.positionNumber", "ASC")
            .getMany();
    }

    /**
     * Obtiene datos paginados para la tabla de CDPs del frontend
     * CORREGIDO: Usa GROUP BY para evitar duplicados por múltiples actividades
     */
    async findForTable(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ): Promise<{ data: CdpTableRowDto[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } }> {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        // Mapeo de campos de ordenamiento para manejar agregados
        const sortMap: Record<string, string> = {
            "cdp.number": "cdp.number",
            "pos.positionNumber": "pos.position_number",
            "pos.value": "pos.value",
            "r.code": "r.code",
            "p.code": "MAX(p.code)",
            "n.code": "n.code"
        };

        const validSortBy = sortBy && sortMap[sortBy] ? sortMap[sortBy] : "cdp.number";

        const queryBuilder = this.repo
            .createQueryBuilder("pos")
            // JOIN 1: CDP Cabecera
            .innerJoin("pos.cdp", "cdp")
            // JOIN 2: Rubro
            .leftJoin("pos.rubric", "r")
            // JOIN 3: Financiación (Aquí nace el duplicado, por eso necesitamos GroupBy)
            .leftJoin("cdp_position_funding", "cpf", "cpf.cdp_position_id = pos.id")
            // JOIN 4: Actividad y Proyecto
            .leftJoin("detailed_activities", "da", "cpf.detailed_activity_id = da.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            // JOIN 5: Puente al Contrato (Necesidad)
            .leftJoin("contract_cdp_relations", "ccr", "ccr.cdp_id = cdp.id")
            .leftJoin("master_contracts", "mc", "ccr.contract_id = mc.id")
            .leftJoin("needs", "n", "mc.need_id = n.id")
            // JOIN 6: Contract Positions (Fondo)
            .leftJoin("contract_positions", "cp", "cp.cdp_funding_id = cpf.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id")
            
            .select([
                "pos.id AS \"id\"",
                "pos.position_number AS \"positionNumber\"",
                "pos.value AS \"positionValue\"",
                "pos.observations AS \"observations\"",
                
                "cdp.number AS \"cdpNumber\"",
                "cdp.total_value AS \"cdpTotalValue\"",
                
                "r.code AS \"rubricCode\"",
                "n.code AS \"needCode\"",

                // AGREGACIONES PARA EVITAR DUPLICADOS
                "MAX(p.code) AS \"projectCode\"", 
                
                // Si hay múltiples fuentes de financiación, las concatenamos
                "STRING_AGG(DISTINCT fs.name, ', ') AS \"fundingSourceName\"",
                "STRING_AGG(DISTINCT fs.code, ', ') AS \"fundingSourceCode\""
            ])
            // AGRUPAMIENTO OBLIGATORIO PARA COLAPSAR FILAS REPETIDAS
            .groupBy("pos.id")
            .addGroupBy("cdp.id") 
            .addGroupBy("cdp.number")
            .addGroupBy("cdp.total_value")
            .addGroupBy("r.code")
            .addGroupBy("n.code");

        // Búsqueda
        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("cdp.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("pos.position_number ILIKE :search", { search: `%${search}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("n.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        // Obtener el total con query separada (sin GROUP BY)
        const countQuery = this.repo
            .createQueryBuilder("pos")
            .innerJoin("pos.cdp", "cdp")
            .leftJoin("pos.rubric", "r")
            .leftJoin("cdp_position_funding", "cpf", "cpf.cdp_position_id = pos.id")
            .leftJoin("detailed_activities", "da", "cpf.detailed_activity_id = da.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            .leftJoin("contract_cdp_relations", "ccr", "ccr.cdp_id = cdp.id")
            .leftJoin("master_contracts", "mc", "ccr.contract_id = mc.id")
            .leftJoin("needs", "n", "mc.need_id = n.id")
            .select("COUNT(DISTINCT pos.id)", "count");

        if (search) {
            countQuery.where(new Brackets((qb) => {
                qb.where("cdp.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("pos.position_number ILIKE :search", { search: `%${search}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("n.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        const countResult = await countQuery.getRawOne();
        const total = countResult ? parseInt(countResult.count, 10) : 0;

        // Paginación y Ordenamiento
        queryBuilder
            .orderBy(validSortBy, validSortOrder)
            .offset(skip)
            .limit(limit);

        const rawData = await queryBuilder.getRawMany();

        const data: CdpTableRowDto[] = rawData.map((row) => ({
            id: row.id,
            projectCode: row.projectCode,
            rubricCode: row.rubricCode,
            positionNumber: row.positionNumber,
            positionValue: row.positionValue ? Number(row.positionValue) : null,
            needCode: row.needCode,
            cdpNumber: row.cdpNumber,
            cdpTotalValue: row.cdpTotalValue ? Number(row.cdpTotalValue) : null,
            fundingSourceName: row.fundingSourceName || null,
            fundingSourceCode: row.fundingSourceCode || null,
            observations: row.observations,
        }));

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
        const queryBuilder = this.repo
            .createQueryBuilder("pos")
            .innerJoin("pos.cdp", "cdp")
            .leftJoin("pos.rubric", "r")
            .leftJoin("cdp_position_funding", "cpf", "cpf.cdp_position_id = pos.id")
            .leftJoin("detailed_activities", "da", "cpf.detailed_activity_id = da.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            .leftJoin("contract_cdp_relations", "ccr", "ccr.cdp_id = cdp.id")
            .leftJoin("master_contracts", "mc", "ccr.contract_id = mc.id")
            .leftJoin("needs", "n", "mc.need_id = n.id")
            .leftJoin("contract_positions", "cp", "cp.cdp_funding_id = cpf.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id")
            .select([
                "pos.id AS \"id\"",
                "MAX(p.code) AS \"projectCode\"",
                "r.code AS \"rubricCode\"",
                "pos.position_number AS \"positionNumber\"",
                "pos.value AS \"positionValue\"",
                "n.code AS \"needCode\"",
                "cdp.number AS \"cdpNumber\"",
                "cdp.total_value AS \"cdpTotalValue\"",
                "STRING_AGG(DISTINCT fs.name, ', ') AS \"fundingSourceName\"",
                "STRING_AGG(DISTINCT fs.code, ', ') AS \"fundingSourceCode\"",
                "pos.observations AS \"observations\""
            ])
            .where("pos.id = :id", { id })
            .groupBy("pos.id")
            .addGroupBy("cdp.id")
            .addGroupBy("cdp.number")
            .addGroupBy("cdp.total_value")
            .addGroupBy("r.code")
            .addGroupBy("n.code");

        const row = await queryBuilder.getRawOne();

        if (!row) {
            throw new NotFoundException("Posición de CDP no encontrada");
        }

        // Query separada para obtener el total consumido correctamente
        const consumedResult = await this.fundingRepo
            .createQueryBuilder("cpf")
            .select("COALESCE(SUM(cpf.assigned_value), 0)", "totalConsumed")
            .where("cpf.cdp_position_id = :id", { id })
            .getRawOne();

        return {
            id: row.id,
            projectCode: row.projectCode,
            rubricCode: row.rubricCode,
            positionNumber: row.positionNumber,
            positionValue: row.positionValue ? Number(row.positionValue) : null,
            needCode: row.needCode,
            cdpNumber: row.cdpNumber,
            cdpTotalValue: row.cdpTotalValue ? Number(row.cdpTotalValue) : null,
            fundingSourceName: row.fundingSourceName || null,
            fundingSourceCode: row.fundingSourceCode || null,
            observations: row.observations,
            totalConsumed: consumedResult?.totalConsumed ? Number(consumedResult.totalConsumed) : 0,
        };
    }

    async updateObservations(id: string, observations: string) {
        // We can just get the entity directly for update to be efficient
        const position = await this.repo.findOne({ where: { id } });
        if (!position) throw new NotFoundException("Posición de CDP no encontrada");
        
        position.observations = observations;
        return this.repo.save(position);
    }

    /**
     * Get detailed activities for a CDP position
     * @param positionId CDP Position ID
     * @param type 'associated' | 'available' | 'all'
     * @param page Page number (1-indexed)
     * @param limit Items per page
     * @param search Search term
     */
    async getDetailedActivitiesForPosition(
        positionId: string,
        type: "associated" | "available" | "all" = "all",
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        // 1. Get the position and its related CDP projects
        const position = await this.repo
            .createQueryBuilder("pos")
            .innerJoin("pos.cdp", "cdp")
            .leftJoin("cdp.cdpProjects", "cdpProjects")
            .addSelect(["cdp.id", "cdpProjects.projectId"])
            .where("pos.id = :positionId", { positionId })
            .getOne();

        if (!position) {
            throw new NotFoundException("Posición de CDP no encontrada");
        }

        // Get project IDs from CDP
        const projectIds = position.cdp?.cdpProjects?.map(cp => cp.projectId) || [];

        if (projectIds.length === 0) {
            return this.emptyPaginatedResponse(page, limit);
        }

        // 2. Get associated activity IDs for this position
        const associatedIds = (await this.fundingRepo.find({
            where: { cdpPositionId: positionId },
            select: ["detailedActivityId"]
        })).map(f => f.detailedActivityId);

        // 3. Build query for detailed activities
        const query = this.detailedActivityRepo.createQueryBuilder("da")
            .leftJoin("da.rubric", "rubric")
            .leftJoin("da.project", "project")
            .addSelect(["da", "rubric.id", "rubric.code", "rubric.accountName", "project.id", "project.code", "project.name"])
            .where("da.projectId IN (:...projectIds)", { projectIds });

        // Apply type filter
        if (type === "associated") {
            if (associatedIds.length === 0) {
                return this.emptyPaginatedResponse(page, limit);
            }
            query.andWhere("da.id IN (:...associatedIds)", { associatedIds });
        } else if (type === "available") {
            if (associatedIds.length > 0) {
                query.andWhere("da.id NOT IN (:...associatedIds)", { associatedIds });
            }
        }
        // type === "all" -> no additional filter

        // Apply search
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

        // Add isAssociated flag when type is "all"
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

    async associateActivity(positionId: string, detailedActivityId: string): Promise<CdpPositionFunding> {
        const position = await this.repo
            .createQueryBuilder("pos")
            .innerJoin("pos.cdp", "cdp")
            .leftJoin("cdp.cdpProjects", "cdpProjects")
            .addSelect(["cdp.id", "cdpProjects.projectId"])
            .where("pos.id = :positionId", { positionId })
            .getOne();

        if (!position) {
            throw new NotFoundException("Posición de CDP no encontrada");
        }

        const detailedActivity = await this.detailedActivityRepo.findOne({ where: { id: detailedActivityId } });
        if (!detailedActivity) {
            throw new NotFoundException("Actividad detallada no encontrada");
        }

        const projectIds = position.cdp?.cdpProjects?.map(cp => cp.projectId) || [];
        if (!projectIds.includes(detailedActivity.projectId)) {
            throw new BadRequestException("La actividad detallada no pertenece al mismo proyecto del CDP");
        }

        const existingFunding = await this.fundingRepo.findOne({
            where: { cdpPositionId: positionId, detailedActivityId: detailedActivityId }
        });
        if (existingFunding) {
            throw new ConflictException("La actividad ya está asociada a esta posición CDP");
        }

        const funding = this.fundingRepo.create({
            cdpPositionId: positionId,
            detailedActivityId: detailedActivityId,
        });

        return this.fundingRepo.save(funding);
    }

    async disassociateActivity(positionId: string, detailedActivityId: string): Promise<void> {
        const funding = await this.fundingRepo.findOne({
            where: { cdpPositionId: positionId, detailedActivityId: detailedActivityId }
        });

        if (!funding) {
            throw new NotFoundException("La relación entre la posición y la actividad no existe");
        }

        const hasBalance = Number(funding.balance || 0) > 0;
        const hasAssignedValue = Number(funding.assignedValue || 0) > 0;

        if (hasBalance || hasAssignedValue) {
            throw new ConflictException("No se puede desasociar la actividad porque tiene fondos asignados");
        }

        try {
            await this.fundingRepo.remove(funding);
        } catch (error: any) {
            if (error.code === "23503") {
                throw new ConflictException("No se puede desasociar la actividad porque está siendo utilizada en posiciones de contrato");
            }
            throw error;
        }
    }
}
