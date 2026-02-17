import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Cdp } from "../entities/cdp.entity";
import { ErrorCodes } from "@common/errors/error-codes";
import { executeFindForSelect, findAllPaginatedByParent } from "../../../shared/helpers";

@Injectable()
export class CdpsService {
    constructor(
        @InjectRepository(Cdp)
        private readonly repo: Repository<Cdp>,
    ) { }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const queryBuilder = this.repo
            .createQueryBuilder("cdp")
            .leftJoin("cdp.cdpProjects", "cdpProjects")
            .leftJoin("cdpProjects.project", "project")
            .addSelect(["cdp", "project.id", "project.code", "project.name"]);

        return findAllPaginatedByParent({
            queryBuilder,
            alias: "cdp",
            applySearch: (qb, s) => {
                qb.where(new Brackets((b) => {
                    b.where("cdp.number ILIKE :search", { search: `%${s}%` })
                        .orWhere("project.code ILIKE :search", { search: `%${s}%` })
                        .orWhere("project.name ILIKE :search", { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "number", "totalValue", "balance", "dateIssue", "project.code", "project.name"],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }

    async findOne(id: string) {
        const cdp = await this.repo
            .createQueryBuilder("cdp")
            .leftJoin("cdp.cdpProjects", "cdpProjects")
            .leftJoin("cdpProjects.project", "project")
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

        if (!cdp) throw new NotFoundException({ message: "CDP no encontrado", code: ErrorCodes.CDP_NOT_FOUND });

        return cdp;
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.repo
            .createQueryBuilder("cdp")
            .select(["cdp.id", "cdp.number"]);

        return executeFindForSelect({
            queryBuilder,
            applySearch: (qb, s) => {
                qb.where(
                    new Brackets((b) => {
                        b.where("cdp.number ILIKE :search", { search: `%${s}%` });
                    })
                );
            },
            orderBy: [["cdp.number", "ASC"]],
            search,
            limit,
            offset,
        });
    }
}
