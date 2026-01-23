import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Need } from "../entities/need.entity";

@Injectable()
export class NeedsService {
    constructor(
        @InjectRepository(Need)
        private repo: Repository<Need>
    ) { }

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

        const sortableFields = ["createAt", "updateAt", "code", "amount", "previousStudy.code", "previousStudy.status"];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.repo
            .createQueryBuilder("need")
            .leftJoinAndSelect("need.previousStudy", "previousStudy");

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("need.description LIKE :search", { search: `%${search}%` })
                    .orWhere("need.code LIKE :search", { search: `%${search}%` })
                    .orWhere("previousStudy.code LIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`need.${validSortBy}`, validSortOrder);
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
        const need = await this.repo.findOne({
            where: { id },
            relations: ["previousStudy"],
        });

        if (!need) throw new NotFoundException("Necesidad no encontrada");

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
        const skip = (page - 1) * limit;
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

        const totalPages = Math.ceil(total / limit);

        return {
            totalValue,
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            }
        };
    }
}
