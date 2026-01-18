import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, Brackets } from "typeorm";
import { BudgetModification, ModificationType } from "../entities/budget-modification.entity";
import { CreateBudgetModificationDto } from "../dtos/create-budget-modification.dto";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";

@Injectable()
export class BudgetModificationsService {
    private readonly logger = new Logger(BudgetModificationsService.name);

    constructor(
        @InjectRepository(BudgetModification)
        private readonly budgetModificationRepository: Repository<BudgetModification>,
        private dataSource: DataSource
    ) { }

    async create(createDto: CreateBudgetModificationDto): Promise<BudgetModification> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const detailedActivity = await queryRunner.manager.findOne(DetailedActivity, {
                where: { id: createDto.detailedActivityId }
            });

            if (!detailedActivity) {
                throw new NotFoundException(`Detailed Activity con id ${createDto.detailedActivityId} no encontrada`);
            }

            let savedModification: BudgetModification;

            if (createDto.modificationType === ModificationType.ADDITION) {
                if (!createDto.value) {
                    throw new BadRequestException("El valor es requerido para ADICIONES");
                }

                const previousBalance = Number(detailedActivity.balance);
                const previousRubricId = detailedActivity.rubricId;

                detailedActivity.budgetCeiling = Number(detailedActivity.budgetCeiling) + createDto.value;
                detailedActivity.balance = Number(detailedActivity.balance) + createDto.value;


                const modification = this.budgetModificationRepository.create({
                    ...createDto,
                    value: createDto.value,
                    previousBalance,
                    newBalance: detailedActivity.balance,
                    previousRubricId,
                    newRubricId: previousRubricId
                });
                savedModification = await queryRunner.manager.save(modification);

            } else if (createDto.modificationType === ModificationType.REDUCTION) {
                if (!createDto.value) {
                    throw new BadRequestException("El valor es requerido para REDUCCIONES");
                }
                if (Number(detailedActivity.balance) < createDto.value) {
                    throw new BadRequestException("No se puede reducir un valor mayor al saldo disponible.");
                }


                const previousBalance = Number(detailedActivity.balance);
                const previousRubricId = detailedActivity.rubricId;

                detailedActivity.budgetCeiling = Number(detailedActivity.budgetCeiling) - createDto.value;
                detailedActivity.balance = Number(detailedActivity.balance) - createDto.value;

                const modification = this.budgetModificationRepository.create({
                    ...createDto,
                    value: createDto.value,
                    previousBalance,
                    newBalance: detailedActivity.balance,
                    previousRubricId,
                    newRubricId: previousRubricId
                });
                savedModification = await queryRunner.manager.save(modification);

            } else if (
                createDto.modificationType === ModificationType.TRANSFER ||
                createDto.modificationType === ModificationType.RECLASSIFICATION
            ) {

                if (!createDto.newRubricId) {
                    throw new BadRequestException("newRubricId es requerido para TRASLADOS o RECLASIFICACIONES");
                }

                if (createDto.newRubricId === detailedActivity.rubricId) {
                    throw new BadRequestException("El nuevo rubro no puede ser igual al actual.");
                }

                const previousBalance = Number(detailedActivity.balance);
                const previousRubricId = detailedActivity.rubricId;


                detailedActivity.rubricId = createDto.newRubricId;

                const modification = this.budgetModificationRepository.create({
                    ...createDto,
                    value: 0,
                    previousBalance,
                    newBalance: previousBalance,
                    previousRubricId,
                    newRubricId: createDto.newRubricId
                });
                savedModification = await queryRunner.manager.save(modification);
            } else {
                // Should not happen if validation works, but for TS safety
                throw new BadRequestException("Tipo de modificación no soportado");
            }

            await queryRunner.manager.save(detailedActivity);
            await queryRunner.commitTransaction();

            return savedModification;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.handleDBExceptions(err);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
        detailedActivityId?: string
    ) {
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createdAt",
            "modificationType",
            "legalDocument",
            "value",
            "detailedActivity.code",
            "detailedActivity.name"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createdAt";

        const queryBuilder = this.budgetModificationRepository
            .createQueryBuilder("bm")
            .leftJoin("bm.detailedActivity", "detailedActivity")
            .leftJoin("bm.previousRubric", "previousRubric")
            .leftJoin("bm.newRubric", "newRubric")
            .select([
                "bm.id",
                "bm.modificationType",
                "bm.legalDocument",
                "bm.dateIssue",
                "bm.value",
                "bm.previousBalance",
                "bm.newBalance",
                "bm.description",
                "bm.createdAt",
                "detailedActivity.id", "detailedActivity.code", "detailedActivity.name",
                "previousRubric.id", "previousRubric.code", "previousRubric.accountName",
                "newRubric.id", "newRubric.code", "newRubric.accountName",
            ]);

        if (detailedActivityId) {
            queryBuilder.andWhere("detailedActivity.id = :detailedActivityId", { detailedActivityId });
        }

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("bm.legalDocument LIKE :search", { search: `%${search}%` })
                    .orWhere("bm.description LIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.code LIKE :search", { search: `%${search}%` })
                    .orWhere("detailedActivity.name LIKE :search", { search: `%${search}%` });
            }));
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            queryBuilder.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            queryBuilder.orderBy(`bm.${validSortBy}`, validSortOrder);
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

    async findOne(id: string): Promise<BudgetModification> {
        const modification = await this.budgetModificationRepository.findOne({
            where: { id },
            relations: ["detailedActivity"],
        });

        if (!modification) {
            throw new NotFoundException(`Modificación con id ${id} no encontrada`);
        }

        return modification;
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(error.detail);
        }
        this.logger.error(error);
    }
}
