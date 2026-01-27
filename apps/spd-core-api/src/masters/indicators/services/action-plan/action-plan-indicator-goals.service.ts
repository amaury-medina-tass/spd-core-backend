import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { ActionPlanIndicatorGoal } from "../../entities/action-plan/action-plan-indicator-goal.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { CreateActionPlanIndicatorGoalDto } from "../../dtos/action-plan/create-action-plan-indicator-goal.dto";
import { UpdateActionPlanIndicatorGoalDto } from "../../dtos/action-plan/create-action-plan-indicator-goal.dto";


@Injectable()
export class ActionPlanIndicatorGoalsService {
    private readonly logger = new Logger(ActionPlanIndicatorGoalsService.name);

    constructor(
        @InjectRepository(ActionPlanIndicatorGoal)
        private readonly goalRepository: Repository<ActionPlanIndicatorGoal>,
        @InjectRepository(ActionPlanIndicator)
        private readonly indicatorRepository: Repository<ActionPlanIndicator>,
    ) { }

    async create(createDto: CreateActionPlanIndicatorGoalDto): Promise<ActionPlanIndicatorGoal> {
        const { indicatorId } = createDto;

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicador con ID ${indicatorId} no encontrado`);
        }

        try {
            const goal = this.goalRepository.create(createDto);
            return await this.goalRepository.save(goal);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllPaginated(
        indicatorId: string,
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
            "indicator.code",
            "indicator.name",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.goalRepository
            .createQueryBuilder("g")
            .leftJoin("g.indicator", "indicator")
            .where("indicator.id = :indicatorId", { indicatorId })
            .addSelect(["g"]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("indicator.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("indicator.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("g.year::text ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`g.${validSortBy}`, validSortOrder);
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

    async findAllByIndicator(indicatorId: string): Promise<ActionPlanIndicatorGoal[]> {
        return this.goalRepository.find({
            where: { indicatorId },
            order: { year: "ASC" },
        });
    }

    async findOne(id: string): Promise<ActionPlanIndicatorGoal> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }
        return goal;
    }

    async update(id: string, updateDto: UpdateActionPlanIndicatorGoalDto): Promise<ActionPlanIndicatorGoal> {
        const goal = await this.findOne(id);
        Object.assign(goal, updateDto);
        try {
            return await this.goalRepository.save(goal);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const goal = await this.findOne(id);
        await this.goalRepository.remove(goal);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe una meta para este indicador y año.");
        }
        this.logger.error(error);
    }
}
