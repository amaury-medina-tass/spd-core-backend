import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Rubric } from "../entities/rubric.entity";
import { executeFindForSelect } from "../../../shared/helpers";

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

        return executeFindForSelect({
            queryBuilder,
            applySearch: (qb, s) => {
                qb.where(
                    new Brackets((b) => {
                        b.where("rubric.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("rubric.description ILIKE :search", { search: `%${s}%` })
                            .orWhere("rubric.accountName ILIKE :search", { search: `%${s}%` });
                    })
                );
            },
            orderBy: [["rubric.code", "ASC"]],
            search,
            limit,
            offset,
        });
    }
}
