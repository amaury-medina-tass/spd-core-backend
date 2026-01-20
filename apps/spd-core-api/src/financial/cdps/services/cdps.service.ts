import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Cdp } from "../entities/cdp.entity";

@Injectable()
export class CdpsService {
    constructor(
        @InjectRepository(Cdp)
        private repo: Repository<Cdp>,
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

        const sortableFields = [
            "createAt",
            "updateAt",
            "number",
            "totalValue",
            "balance",
            "dateIssue",
            "project.code",
            "project.name"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.repo
            .createQueryBuilder("cdp")
            .leftJoin("cdp.project", "project")
            .addSelect(["cdp", "project.id", "project.code", "project.name"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("cdp.number ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("project.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`cdp.${validSortBy}`, validSortOrder);
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
        const cdp = await this.repo
            .createQueryBuilder("cdp")
            .leftJoin("cdp.project", "project")
            .leftJoin("cdp.positions", "positions")
            .leftJoin("positions.rubric", "rubric")
            .addSelect([
                "cdp",
                "project.id", "project.code", "project.name",
                "positions.id", "positions.positionNumber", "positions.value", "positions.balance", "positions.observations",
                "rubric.id", "rubric.code", "rubric.accountName"
            ])
            .where("cdp.id = :id", { id })
            .getOne();

        if (!cdp) throw new NotFoundException("CDP no encontrado");

        return cdp;
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.repo
            .createQueryBuilder("cdp")
            .select(["cdp.id", "cdp.number"]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("cdp.number ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("cdp.number", "ASC")
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
