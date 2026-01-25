import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Variable } from "../entities/variable.entity";
import { CreateVariableDto } from "../dtos/create-variable.dto";
import { UpdateVariableDto } from "../dtos/update-variable.dto";

@Injectable()
export class VariablesService {
    private readonly logger = new Logger(VariablesService.name);

    constructor(
        @InjectRepository(Variable)
        private readonly variableRepository: Repository<Variable>,
    ) { }

    async create(createDto: CreateVariableDto): Promise<Variable> {
        try {
            const variable = this.variableRepository.create(createDto);
            return await this.variableRepository.save(variable);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "code",
            "name",
            "observations",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.variableRepository
            .createQueryBuilder("variable")
            .select(["variable"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.observations ILIKE :search", { search: `%${search}%` });
            }));
        }

        queryBuilder.orderBy(`variable.${validSortBy}`, validSortOrder);

        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

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

    async findOne(id: string): Promise<Variable> {
        const variable = await this.variableRepository.findOne({
            where: { id },
        });

        if (!variable) {
            throw new NotFoundException(`Variable with id ${id} not found`);
        }

        return variable;
    }

    async update(id: string, updateDto: UpdateVariableDto): Promise<Variable> {
        const variable = await this.variableRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!variable) {
            throw new NotFoundException(`Variable with id ${id} not found`);
        }

        try {
            return await this.variableRepository.save(variable);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const variable = await this.findOne(id);
        await this.variableRepository.remove(variable);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(error.detail);
        }
        this.logger.error(error);
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.variableRepository
            .createQueryBuilder("variable")
            .select([
                "variable.id",
                "variable.code",
                "variable.name",
                "variable.observations",
                "variable.createAt",
            ]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("variable.name ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("variable.createAt", "DESC")
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
