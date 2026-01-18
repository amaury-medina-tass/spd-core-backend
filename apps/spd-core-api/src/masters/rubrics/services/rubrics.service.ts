import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Rubric } from "../entities/rubric.entity";

@Injectable()
export class RubricsService {
    constructor(
        @InjectRepository(Rubric)
        private readonly rubricRepository: Repository<Rubric>,
    ) { }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.rubricRepository
            .createQueryBuilder("rubric")
            .select(["rubric.id", "rubric.code", "rubric.level", "rubric.type", "rubric.accountName", "rubric.description"]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("rubric.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("rubric.description ILIKE :search", { search: `%${search}%` })
                        .orWhere("rubric.accountName ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("rubric.code", "ASC")
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
