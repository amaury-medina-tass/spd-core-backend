import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Commune } from "../entities/commune.entity";
import { executeFindForSelect } from "../../../shared/helpers";

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

        return executeFindForSelect({
            queryBuilder,
            search,
            limit,
            offset,
            orderBy: [["CAST(commune.code AS INTEGER)", "ASC"]],
            applySearch: (qb, s) => {
                qb.where(
                    new Brackets((sub) => {
                        sub.where("commune.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("commune.name ILIKE :search", { search: `%${s}%` });
                    }),
                );
            },
        });
    }
}
