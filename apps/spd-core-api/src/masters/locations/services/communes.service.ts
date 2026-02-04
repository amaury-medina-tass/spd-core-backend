import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Commune } from "../entities/commune.entity";

@Injectable()
export class CommunesService {
    private readonly logger = new Logger(CommunesService.name);

    constructor(
        @InjectRepository(Commune)
        private readonly communeRepository: Repository<Commune>,
    ) { }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.communeRepository
            .createQueryBuilder("commune")
            .select([
                "commune.id",
                "commune.code",
                "commune.name",
            ]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("commune.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("commune.name ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("CAST(commune.code AS INTEGER)", "ASC")
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
