import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { PreviousStudy } from "../entities/previous-study.entity";

@Injectable()
export class PreviousStudiesService {
    constructor(
        @InjectRepository(PreviousStudy)
        private repo: Repository<PreviousStudy>
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
                { code: ILike(`%${search}%`) },
                { status: ILike(`%${search}%`) },
            ];
        }

        const sortableFields = [
            "createAt",
            "code",
            "status",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";
        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const [data, total] = await this.repo.findAndCount({
            where: whereCondition,
            skip,
            take: limit,
            order: { [validSortBy]: validSortOrder },
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
