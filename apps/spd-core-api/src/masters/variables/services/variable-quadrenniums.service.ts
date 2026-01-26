import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { VariableQuadrennium } from "../entities/variable-quadrennium.entity";
import { CreateVariableQuadrenniumDto } from "../dtos/create-variable-quadrennium.dto";
import { UpdateVariableQuadrenniumDto } from "../dtos/update-variable-quadrennium.dto";

@Injectable()
export class VariableQuadrenniumsService {
    private readonly logger = new Logger(VariableQuadrenniumsService.name);

    constructor(
        @InjectRepository(VariableQuadrennium)
        private readonly variableQuadrenniumRepository: Repository<VariableQuadrennium>,
    ) { }

    async create(createDto: CreateVariableQuadrenniumDto): Promise<VariableQuadrennium> {
        if ((createDto.endYear - createDto.startYear) !== 3) {
            throw new BadRequestException("El rango de fechas debe ser de 4 años (ej: 2024-2027)");
        }

        try {
            const variableQuadrennium = this.variableQuadrenniumRepository.create(createDto);
            return await this.variableQuadrenniumRepository.save(variableQuadrennium);
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
            "startYear",
            "endYear",
            "value",
            "variable.code",
            "variable.name",
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.variableQuadrenniumRepository
            .createQueryBuilder("vq")
            .leftJoin("vq.variable", "variable")
            .where("variable.id = :variableId", { variableId })
            .addSelect(["vq"]);

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("variable.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("variable.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("vq.startYear::text ILIKE :search", { search: `%${search}%` })
                    .orWhere("vq.endYear::text ILIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`vq.${validSortBy}`, validSortOrder);
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

    async update(id: string, updateDto: UpdateVariableQuadrenniumDto): Promise<VariableQuadrennium> {
        const variableQuadrennium = await this.variableQuadrenniumRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!variableQuadrennium) {
            throw new NotFoundException(`Variable Quadrennium with id ${id} not found`);
        }

        if ((variableQuadrennium.endYear - variableQuadrennium.startYear) !== 3) {
            throw new BadRequestException("El rango de fechas debe ser de 4 años (ej: 2024-2027)");
        }

        try {
            return await this.variableQuadrenniumRepository.save(variableQuadrennium);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const variableQuadrennium = await this.variableQuadrenniumRepository.findOne({ where: { id } });

        if (!variableQuadrennium) {
            throw new NotFoundException(`Variable Quadrennium with id ${id} not found`);
        }

        await this.variableQuadrenniumRepository.remove(variableQuadrennium);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe una meta (cuatrenio) para esta variable en el rango de años especificado");
        }
        this.logger.error(error);
    }
}
