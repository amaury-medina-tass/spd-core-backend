import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { VariableGoal } from "../entities/variable-goal.entity";
import { CreateVariableGoalDto } from "../dtos/create-variable-goal.dto";
import { UpdateVariableGoalDto } from "../dtos/update-variable-goal.dto";

@Injectable()
export class VariableGoalsService {
    private readonly logger = new Logger(VariableGoalsService.name);

    constructor(
        @InjectRepository(VariableGoal)
        private readonly variableGoalRepository: Repository<VariableGoal>,
    ) { }

    async create(createDto: CreateVariableGoalDto): Promise<VariableGoal> {
        try {
            const variableGoal = this.variableGoalRepository.create(createDto);
            return await this.variableGoalRepository.save(variableGoal);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllPaginated(
        variableId: string,
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
            "year",
            "value",
            "variable.code",
            "variable.name",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.variableGoalRepository
            .createQueryBuilder("variableGoal")
            .leftJoin("variableGoal.variable", "variable")
            .where("variable.id = :variableId", { variableId })
            .addSelect(["variableGoal", "variable.id", "variable.code", "variable.name"]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("variableGoal.year::text ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`variableGoal.${validSortBy}`, validSortOrder);
        }

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

    async update(id: string, updateDto: UpdateVariableGoalDto): Promise<VariableGoal> {
        const variableGoal = await this.variableGoalRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!variableGoal) {
            throw new NotFoundException(`Variable Goal with id ${id} not found`);
        }

        try {
            return await this.variableGoalRepository.save(variableGoal);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const variableGoal = await this.variableGoalRepository.findOne({ where: { id } });

        if (!variableGoal) {
            throw new NotFoundException(`Variable Goal with id ${id} not found`);
        }

        await this.variableGoalRepository.remove(variableGoal);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe una meta para esta variable en el año especificado");
        }
        this.logger.error(error);
    }
}
