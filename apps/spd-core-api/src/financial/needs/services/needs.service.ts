import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Need } from "../entities/need.entity";
import { ErrorCodes } from "@common/errors/error-codes";
import { buildPaginatedMeta, calculateSkip, findAllPaginatedByParent } from "../../../shared/helpers";

@Injectable()
export class NeedsService {
    constructor(
        @InjectRepository(Need)
        private readonly repo: Repository<Need>
    ) { }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const queryBuilder = this.repo
            .createQueryBuilder("need")
            .leftJoinAndSelect("need.previousStudy", "previousStudy");

        return findAllPaginatedByParent({
            queryBuilder,
            alias: "need",
            applySearch: (qb, s) => {
                qb.where(new Brackets((b) => {
                    b.where("need.description LIKE :search", { search: `%${s}%` })
                        .orWhere("need.code LIKE :search", { search: `%${s}%` })
                        .orWhere("previousStudy.code LIKE :search", { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "code", "amount", "previousStudy.code", "previousStudy.status"],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }
    async findOne(id: string) {
        const need = await this.repo.findOne({
            where: { id },
            relations: ["previousStudy"],
        });

        if (!need) throw new NotFoundException({ message: "Necesidad no encontrada", code: ErrorCodes.NEED_NOT_FOUND });

        return need;
    }

    async findCdpPositionsByNeedId(
        id: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = calculateSkip(page, limit);
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        // Mapeo de campos para el ordenamiento
        const sortMap: Record<string, string> = {
            "projectCode": "p.code",
            "cdpNumber": "c.number",
            "fundingSourceCode": "fs.code",
            "fundingSourceName": "fs.name",
            "cdpTotalValue": "c.total_value",
            "positionNumber": "pos.position_number",
            "positionValue": "pos.value",
        };

        const sortField = sortBy && sortMap[sortBy] ? sortMap[sortBy] : "c.number";

        const queryBuilder = this.repo.createQueryBuilder("n")
            .innerJoin("master_contracts", "mc", "n.id = mc.need_id")
            .innerJoin("contract_positions", "cp", "mc.id = cp.contract_id")
            .leftJoin("projects", "p", "cp.project_id = p.id")
            .leftJoin("funding_sources", "fs", "cp.funding_source_id = fs.id")
            .innerJoin("cdp_positions", "pos", "cp.cdp_position_id = pos.id")
            .innerJoin("cdps", "c", "pos.cdp_id = c.id")
            .where("n.id = :id", { id });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("p.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("c.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("fs.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("fs.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("pos.observations ILIKE :search", { search: `%${search}%` });
            }));
        }

        // Obtener el total de valores filtrados antes de paginar
        const totalValueResult = await queryBuilder
            .select("COALESCE(SUM(pos.value), 0)", "totalValue")
            .getRawOne();
        const totalValue = Number(totalValueResult.totalValue);

        // Obtener el conteo total para paginación
        const total = await queryBuilder.getCount();

        // Aplicar ordenamiento y paginación
        const result = await queryBuilder
            .select([
                "p.code AS \"projectCode\"",
                "c.number AS \"cdpNumber\"",
                "fs.code AS \"fundingSourceCode\"",
                "fs.name AS \"fundingSourceName\"",
                "c.total_value AS \"cdpTotalValue\"",
                "pos.position_number AS \"positionNumber\"",
                "pos.value AS \"positionValue\"",
                "pos.observations AS \"observations\""
            ])
            .orderBy(sortField, validSortOrder)
            .offset(skip)
            .limit(limit)
            .getRawMany();

        const data = result.map(item => ({
            projectCode: item.projectCode,
            cdpNumber: item.cdpNumber,
            fundingSourceCode: item.fundingSourceCode,
            fundingSourceName: item.fundingSourceName,
            cdpTotalValue: Number(item.cdpTotalValue),
            positionNumber: item.positionNumber,
            positionValue: Number(item.positionValue),
            observations: item.observations
        }));

        return {
            totalValue,
            data,
            meta: buildPaginatedMeta(total, page, limit),
        };
    }
}
