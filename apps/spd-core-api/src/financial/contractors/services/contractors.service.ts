import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Contractor } from "../entities/contractor.entity";

@Injectable()
export class ContractorsService {
    constructor(
        @InjectRepository(Contractor)
        private repo: Repository<Contractor>
    ) { }

    async findAll(search?: string) {
        let whereCondition: any = {};

        if (search) {
            whereCondition = [
                { nit: ILike(`%${search}%`) },
                { name: ILike(`%${search}%`) },
            ];
        }

        return this.repo.find({
            where: whereCondition,
            order: { name: "ASC" },
            take: 50 // Limit results for dropdowns
        });
    }
}
