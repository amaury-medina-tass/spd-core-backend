import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { MasterContract } from "../entities/master-contract.entity";
import { ErrorCodes } from "@common/errors/error-codes";
import { findAllPaginatedByParent } from "../../../shared/helpers";

@Injectable()
export class MasterContractsService {
    constructor(
        @InjectRepository(MasterContract)
        private readonly repo: Repository<MasterContract>
    ) { }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const queryBuilder = this.repo
            .createQueryBuilder("masterContract")
            .leftJoin("masterContract.need", "need")
            .leftJoin("masterContract.contractor", "contractor")
            .addSelect(["masterContract", "need.id", "need.code", "contractor.id", "contractor.name", "contractor.nit"]);

        return findAllPaginatedByParent({
            queryBuilder,
            alias: "masterContract",
            applySearch: (qb, s) => {
                qb.where(new Brackets((b) => {
                    b.where("masterContract.number LIKE :search", { search: `%${s}%` })
                        .orWhere("masterContract.object LIKE :search", { search: `%${s}%` })
                        .orWhere("contractor.name LIKE :search", { search: `%${s}%` })
                        .orWhere("contractor.nit LIKE :search", { search: `%${s}%` })
                        .orWhere("CAST(need.code AS TEXT) LIKE :search", { search: `%${s}%` });
                }));
            },
            sortableFields: ["createAt", "updateAt", "number", "object", "totalValue", "state", "contractor.name", "contractor.nit", "need.code"],
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });
    }

    async findOne(id: string) {
        const masterContract = await this.repo
            .createQueryBuilder("masterContract")
            .leftJoin("masterContract.need", "need")
            .leftJoin("masterContract.contractor", "contractor")
            .addSelect(["masterContract", "need.id", "need.code", "contractor.id", "contractor.name", "contractor.nit"])
            .where("masterContract.id = :id", { id })
            .getOne();

        if (!masterContract) throw new NotFoundException({ message: "Contrato marco no encontrado", code: ErrorCodes.MASTER_CONTRACT_NOT_FOUND });

        return masterContract;
    }
}
