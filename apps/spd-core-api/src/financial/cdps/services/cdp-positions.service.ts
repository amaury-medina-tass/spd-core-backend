import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { CdpPosition } from "../entities/cdp-position.entity";
import { CdpTableRowDto } from "../dtos/cdp-table-row.dto";

@Injectable()
export class CdpPositionsService {
    constructor(
        @InjectRepository(CdpPosition)
        private repo: Repository<CdpPosition>,
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
     * Incluye: proyecto, rubro, posición, necesidad, fondo, observaciones
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

        const sortableFields = [
            "cdp.number",
            "pos.positionNumber",
            "pos.value",
            "r.code",
            "p.code",
            "n.code"
        ];
        // Default sort by CDP Number unless specified
        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "cdp.number";

        const queryBuilder = this.repo
            .createQueryBuilder("pos")
            // JOIN 1: CDP Cabecera (Necesario porque empezamos desde pos)
            .innerJoin("pos.cdp", "cdp")
            // JOIN 2: Rubro
            .leftJoin("pos.rubric", "r")
            // JOIN 3: Financiación (cdp_position_funding)
            .leftJoin("cdp_position_funding", "cpf", "cpf.cdp_position_id = pos.id")
            // JOIN 4: Actividad y Proyecto
            .leftJoin("detailed_activities", "da", "cpf.detailed_activity_id = da.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            // LEFT JOIN 5: The Bridge al Contrato (Para traer la Necesidad)
            .leftJoin("contract_cdp_relations", "ccr", "ccr.cdp_id = cdp.id")
            .leftJoin("master_contracts", "mc", "ccr.contract_id = mc.id")
            .leftJoin("needs", "n", "mc.need_id = n.id")
            // LEFT JOIN 6: Contract Positions (Para traer Fondo)
            .leftJoin("contract_positions", "cp", "cp.cdp_funding_id = cpf.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id")
            .select([
                "pos.id AS \"id\"",
                "p.code AS \"projectCode\"",
                "r.code AS \"rubricCode\"",
                "pos.position_number AS \"positionNumber\"",
                "pos.value AS \"positionValue\"",
                "n.code AS \"needCode\"",
                "cdp.number AS \"cdpNumber\"",
                "cdp.total_value AS \"cdpTotalValue\"",
                "fs.name AS \"fundingSourceName\"",
                "fs.code AS \"fundingSourceCode\"",
                "pos.observations AS \"observations\""
            ]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("cdp.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("pos.position_number ILIKE :search", { search: `%${search}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("n.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        queryBuilder.orderBy(validSortBy, validSortOrder);

        // Get total count (simplest way is to clone logic or re-use builders, but for raw queries count usually needs separate builder or standard count)
        // Since we have many joins and potential distinct issues with raw data, let's use the same base query logic for count
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
            .leftJoin("contract_positions", "cp", "cp.cdp_funding_id = cpf.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id");

        if (search) {
            countQuery.andWhere(new Brackets((qb) => {
                qb.where("cdp.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("pos.position_number ILIKE :search", { search: `%${search}%` })
                    .orWhere("r.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("p.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("n.code ILIKE :search", { search: `%${search}%` });
            }));
        }

        const total = await countQuery.getCount();

        // Get paginated data
        queryBuilder.offset(skip).limit(limit);
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
            fundingSourceName: row.fundingSourceName,
            fundingSourceCode: row.fundingSourceCode,
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
            // JOIN 1: CDP Cabecera
            .innerJoin("pos.cdp", "cdp")
            // JOIN 2: Rubro
            .leftJoin("pos.rubric", "r")
            // JOIN 3: Financiación (cdp_position_funding)
            .leftJoin("cdp_position_funding", "cpf", "cpf.cdp_position_id = pos.id")
            // JOIN 4: Actividad y Proyecto
            .leftJoin("detailed_activities", "da", "cpf.detailed_activity_id = da.id")
            .leftJoin("projects", "p", "da.project_id = p.id")
            // LEFT JOIN 5: The Bridge al Contrato (Para traer la Necesidad)
            .leftJoin("contract_cdp_relations", "ccr", "ccr.cdp_id = cdp.id")
            .leftJoin("master_contracts", "mc", "ccr.contract_id = mc.id")
            .leftJoin("needs", "n", "mc.need_id = n.id")
            // LEFT JOIN 6: Contract Positions (Para traer Fondo)
            .leftJoin("contract_positions", "cp", "cp.cdp_funding_id = cpf.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id")
            .select([
                "pos.id AS \"id\"",
                "p.code AS \"projectCode\"",
                "r.code AS \"rubricCode\"",
                "pos.position_number AS \"positionNumber\"",
                "pos.value AS \"positionValue\"",
                "n.code AS \"needCode\"",
                "cdp.number AS \"cdpNumber\"",
                "cdp.total_value AS \"cdpTotalValue\"",
                "fs.name AS \"fundingSourceName\"",
                "fs.code AS \"fundingSourceCode\"",
                "pos.observations AS \"observations\""
            ])
            .where("pos.id = :id", { id });

        const row = await queryBuilder.getRawOne();

        if (!row) {
            throw new NotFoundException("Posición de CDP no encontrada");
        }

        return {
            id: row.id,
            projectCode: row.projectCode,
            rubricCode: row.rubricCode,
            positionNumber: row.positionNumber,
            positionValue: row.positionValue ? Number(row.positionValue) : null,
            needCode: row.needCode,
            cdpNumber: row.cdpNumber,
            cdpTotalValue: row.cdpTotalValue ? Number(row.cdpTotalValue) : null,
            fundingSourceName: row.fundingSourceName,
            fundingSourceCode: row.fundingSourceCode,
            observations: row.observations,
        };
    }

    async updateObservations(id: string, observations: string) {
        // We can just get the entity directly for update to be efficient
        const position = await this.repo.findOne({ where: { id } });
        if (!position) throw new NotFoundException("Posición de CDP no encontrada");
        
        position.observations = observations;
        return this.repo.save(position);
    }
}
