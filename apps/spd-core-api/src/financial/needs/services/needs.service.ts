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
}
