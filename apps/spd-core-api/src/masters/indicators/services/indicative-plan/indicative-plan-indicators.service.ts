import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { IndicatorType } from "../../entities/common/indicator-type.entity";
import { UnitMeasure } from "../../entities/common/unit-measure.entity";
import { IndicatorDirection } from "../../entities/common/indicator-direction.entity";
import { CreateIndicativePlanIndicatorDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator.dto";
import { UpdateIndicativePlanIndicatorDto } from "../../dtos/indicative-plan/update-indicative-plan-indicator.dto";

@Injectable()
export class IndicativePlanIndicatorsService {
    private readonly logger = new Logger(IndicativePlanIndicatorsService.name);

    constructor(
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicatorRepository: Repository<IndicativePlanIndicator>,
        @InjectRepository(IndicatorType)
        private readonly indicatorTypeRepository: Repository<IndicatorType>,
        @InjectRepository(UnitMeasure)
        private readonly unitMeasureRepository: Repository<UnitMeasure>,
        @InjectRepository(IndicatorDirection)
        private readonly indicatorDirectionRepository: Repository<IndicatorDirection>,
    ) { }

    async create(createDto: CreateIndicativePlanIndicatorDto): Promise<IndicativePlanIndicator> {
        try {
            if (createDto.code) {
                const existing = await this.indicatorRepository.findOne({ where: { code: createDto.code } });
                if (existing) {
                    throw new BadRequestException(`El código ${createDto.code} ya existe para otro indicador.`);
                }
            }
            const indicator = this.indicatorRepository.create(createDto);
            return await this.indicatorRepository.save(indicator);
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

        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "code",
            "name",
            "programName",
            "pillarName",
            "componentName",
            "indicatorType.name",
            "unitMeasure.name",
            "direction.name"
        ];

        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "code";

        const queryBuilder = this.indicatorRepository.createQueryBuilder("i")
            .leftJoin("i.indicatorType", "indicatorType")
            .leftJoin("i.unitMeasure", "unitMeasure")
            .leftJoin("i.direction", "direction")
            .addSelect(["i", "indicatorType.id", "indicatorType.name", "unitMeasure.id", "unitMeasure.name", "direction.id", "direction.name"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.programName ILIKE :search", { search: `%${search}%` })
                    .orWhere("indicatorType.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("unitMeasure.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`i.${validSortBy}`, validSortOrder);
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

    async findOne(id: string): Promise<IndicativePlanIndicator> {
        const indicator = await this.indicatorRepository.findOne({
            where: { id },
            relations: ["indicatorType", "unitMeasure", "direction"],
        });
        if (!indicator) {
            throw new NotFoundException(`Indicator with ID ${id} not found`);
        }
        return indicator;
    }

    async update(id: string, updateDto: UpdateIndicativePlanIndicatorDto): Promise<IndicativePlanIndicator> {
        const indicator = await this.findOne(id);
        if (updateDto.code) {
            const existing = await this.indicatorRepository.findOne({ where: { code: updateDto.code } });
            if (existing && existing.id !== id) {
                throw new BadRequestException(`El código ${updateDto.code} ya existe para otro indicador.`);
            }
        }
        Object.assign(indicator, updateDto);
        try {
            return await this.indicatorRepository.save(indicator);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const indicator = await this.findOne(id);
        await this.indicatorRepository.remove(indicator);
    }

    async getCatalogs() {
        const [indicatorTypes, unitMeasures, indicatorDirections] = await Promise.all([
            this.indicatorTypeRepository.find({ order: { name: "ASC" } }),
            this.unitMeasureRepository.find({ order: { name: "ASC" } }),
            this.indicatorDirectionRepository.find({ order: { name: "ASC" } }),
        ]);

        return {
            indicatorTypes,
            unitMeasures,
            indicatorDirections,
        };
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(error.detail);
        }
        this.logger.error(error);
    }
}
