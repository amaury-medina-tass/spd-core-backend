import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { ActionPlanIndicatorQuadrennium } from "../../entities/action-plan/action-plan-indicator-quadrennium.entity";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { CreateActionPlanIndicatorQuadrenniumDto } from "../../dtos/action-plan/create-action-plan-indicator-quadrennium.dto";
import { UpdateActionPlanIndicatorQuadrenniumDto } from "../../dtos/action-plan/create-action-plan-indicator-quadrennium.dto";

@Injectable()
export class ActionPlanIndicatorQuadrenniumsService {
    private readonly logger = new Logger(ActionPlanIndicatorQuadrenniumsService.name);

    constructor(
        @InjectRepository(ActionPlanIndicatorQuadrennium)
        private readonly quadrenniumRepository: Repository<ActionPlanIndicatorQuadrennium>,
        @InjectRepository(ActionPlanIndicator)
        private readonly indicatorRepository: Repository<ActionPlanIndicator>,
    ) { }

    async create(createDto: CreateActionPlanIndicatorQuadrenniumDto): Promise<ActionPlanIndicatorQuadrennium> {
        const { indicatorId } = createDto;

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicador con ID ${indicatorId} no encontrado`);
        }

        try {
            const quadrennium = this.quadrenniumRepository.create(createDto);
            return await this.quadrenniumRepository.save(quadrennium);
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
            "startYear",
            "endYear",
            "value",
            "indicator.code",
            "indicator.name",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.quadrenniumRepository
            .createQueryBuilder("q")
            .leftJoin("q.indicator", "indicator")
            .where("indicator.id = :indicatorId", { indicatorId })
            .addSelect(["q"]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("indicator.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("indicator.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("q.start_year::text ILIKE :search", { search: `%${search}%` })
                    .orWhere("q.end_year::text ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`q.${validSortBy}`, validSortOrder);
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


    async findOne(id: string): Promise<ActionPlanIndicatorQuadrennium> {
        const quadrennium = await this.quadrenniumRepository.findOne({ where: { id } });
        if (!quadrennium) {
            throw new NotFoundException(`Quadrennium with ID ${id} not found`);
        }
        return quadrennium;
    }

    async update(id: string, updateDto: UpdateActionPlanIndicatorQuadrenniumDto): Promise<ActionPlanIndicatorQuadrennium> {
        const quadrennium = await this.findOne(id);
        Object.assign(quadrennium, updateDto);
        try {
            return await this.quadrenniumRepository.save(quadrennium);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const quadrennium = await this.findOne(id);
        await this.quadrenniumRepository.remove(quadrennium);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe un cuatrienio para este indicador y rango de años.");
        }
        this.logger.error(error);
    }
}
