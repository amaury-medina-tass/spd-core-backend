import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
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

        let whereCondition: any = {};

        if (search) {
            whereCondition = [
                { description: ILike(`%${search}%`) },
            ];
        }

        const sortableFields = ["createAt", "code", "amount"];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";
        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const [data, total] = await this.repo.findAndCount({
            where: whereCondition,
            skip,
            take: limit,
            order: { [validSortBy]: validSortOrder },
            relations: ["previousStudy"], // Include relation just in case
        });

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
}
