import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { CdpPosition } from "../entities/cdp-position.entity";

@Injectable()
export class CdpPositionsService {
    constructor(
        @InjectRepository(CdpPosition)
        private repo: Repository<CdpPosition>,
    ) { }

    async findByCdpId(cdpId: string, search?: string) {
        const queryBuilder = this.repo
            .createQueryBuilder("position")
            .leftJoin("position.rubric", "rubric")
            .addSelect([
                "position",
                "rubric.id", "rubric.code", "rubric.accountName"
            ])
            .where("position.cdp_id = :cdpId", { cdpId });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("position.positionNumber ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("rubric.accountName ILIKE :search", { search: `%${search}%` });
            }));
        }

        return queryBuilder
            .orderBy("position.positionNumber", "ASC")
            .getMany();
    }

    async findOne(id: string) {
        const position = await this.repo
            .createQueryBuilder("position")
            .leftJoin("position.cdp", "cdp")
            .leftJoin("position.rubric", "rubric")
            .addSelect([
                "position",
                "cdp.id", "cdp.number",
                "rubric.id", "rubric.code", "rubric.accountName"
            ])
            .where("position.id = :id", { id })
            .getOne();

        if (!position) throw new NotFoundException("Posición CDP no encontrada");

        return position;
    }

    async updateObservations(id: string, observations: string) {
        const position = await this.findOne(id);
        position.observations = observations;
        return this.repo.save(position);
    }
}
