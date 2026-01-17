import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { MasterContract } from "../entities/master-contract.entity";

@Injectable()
export class MasterContractsService {
    constructor(
        @InjectRepository(MasterContract)
        private repo: Repository<MasterContract>
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
            "object",
            "totalValue",
            "state",
            "contractor.name",
            "contractor.nit",
            "need.code"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.repo
            .createQueryBuilder("masterContract")
            .leftJoin("masterContract.need", "need")
            .leftJoin("masterContract.contractor", "contractor")
            .addSelect(["masterContract", "need.id", "need.code", "contractor.id", "contractor.name", "contractor.nit"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("masterContract.number LIKE :search", { search: `%${search}%` })
                    .orWhere("masterContract.object LIKE :search", { search: `%${search}%` })
                    .orWhere("contractor.name LIKE :search", { search: `%${search}%` })
                    .orWhere("contractor.nit LIKE :search", { search: `%${search}%` })
                    .orWhere("CAST(need.code AS TEXT) LIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`masterContract.${validSortBy}`, validSortOrder);
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
        const masterContract = await this.repo
            .createQueryBuilder("masterContract")
            .leftJoin("masterContract.need", "need")
            .leftJoin("masterContract.contractor", "contractor")
            .addSelect(["masterContract", "need.id", "need.code", "contractor.id", "contractor.name", "contractor.nit"])
            .where("masterContract.id = :id", { id })
            .getOne();

        if (!masterContract) throw new NotFoundException("Contrato marco no encontrado");

        return masterContract;
    }
}
