import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Dependency } from "../entities/dependency.entity";

@Injectable()
export class DependenciesService {
    constructor(
        @InjectRepository(Dependency)
        private repo: Repository<Dependency>
    ) { }

    async findOneByCode(code: string) {
        return this.repo.findOne({ where: { code } });
    }

    async findOne(id: string) {
        return this.repo.findOne({ where: { id } });
    }

    async findAll(search?: string) {
        let whereCondition: any = {};

        if (search) {
            whereCondition = [
                { code: ILike(`%${search}%`) },
                { name: ILike(`%${search}%`) },
            ];
        }

        return this.repo.find({
            where: whereCondition,
            order: { name: "ASC" },
        });
    }
}
