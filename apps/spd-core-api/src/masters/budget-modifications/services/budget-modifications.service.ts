import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, Brackets } from "typeorm";
import { BudgetModification, ModificationType } from "../entities/budget-modification.entity";
import { CreateBudgetModificationDto } from "../dtos/create-budget-modification.dto";
import { DetailedActivity } from "../../detailed-activities/entities/detailed-activity.entity";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class BudgetModificationsService {
    private readonly logger = new Logger(BudgetModificationsService.name);

    constructor(
        @InjectRepository(BudgetModification)
        private readonly budgetModificationRepository: Repository<BudgetModification>,
        private readonly dataSource: DataSource,
        private readonly auditLog: AuditLogService,
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
                throw new NotFoundException({ message: `Detailed Activity con id ${createDto.detailedActivityId} no encontrada`, code: ErrorCodes.DETAILED_ACTIVITY_NOT_FOUND });
            }

            const savedModification = await this.applyModification(createDto, detailedActivity, queryRunner);

            await queryRunner.manager.save(detailedActivity);
            await queryRunner.commitTransaction();

            await this.auditLog.logSuccess(AuditAction.BUDGET_MODIFICATION_CREATED, AuditEntityType.BUDGET_MODIFICATION, savedModification.id, {
                entityName: `${savedModification.modificationType} - ${detailedActivity.code}`,
                system: SYSTEM_NAME,
                metadata: {
                    modificationType: savedModification.modificationType,
                    value: savedModification.value,
                    detailedActivityId: createDto.detailedActivityId,
                },
            });

            return savedModification;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.handleDBExceptions(err);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async applyModification(
        createDto: CreateBudgetModificationDto,
        detailedActivity: DetailedActivity,
        queryRunner: any
    ): Promise<BudgetModification> {
        switch (createDto.modificationType) {
            case ModificationType.ADDITION:
                return this.applyAddition(createDto, detailedActivity, queryRunner);
            case ModificationType.REDUCTION:
                return this.applyReduction(createDto, detailedActivity, queryRunner);
            case ModificationType.TRANSFER:
            case ModificationType.RECLASSIFICATION:
                return this.applyTransferOrReclassification(createDto, detailedActivity, queryRunner);
            default:
                throw new BadRequestException({ message: "Tipo de modificación no soportado", code: ErrorCodes.BUDGET_MODIFICATION_UNSUPPORTED_TYPE });
        }
    }

    private async applyAddition(
        createDto: CreateBudgetModificationDto,
        detailedActivity: DetailedActivity,
        queryRunner: any
    ): Promise<BudgetModification> {
        if (!createDto.value) {
            throw new BadRequestException({ message: "El valor es requerido para ADICIONES", code: ErrorCodes.BUDGET_MODIFICATION_INVALID_VALUE });
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
        return queryRunner.manager.save(modification);
    }

    private async applyReduction(
        createDto: CreateBudgetModificationDto,
        detailedActivity: DetailedActivity,
        queryRunner: any
    ): Promise<BudgetModification> {
        if (!createDto.value) {
            throw new BadRequestException({ message: "El valor es requerido para REDUCCIONES", code: ErrorCodes.BUDGET_MODIFICATION_INVALID_VALUE });
        }
        if (Number(detailedActivity.balance) < createDto.value) {
            throw new BadRequestException({ message: "No se puede reducir un valor mayor al saldo disponible.", code: ErrorCodes.BUDGET_MODIFICATION_INSUFFICIENT_BALANCE });
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
        return queryRunner.manager.save(modification);
    }

    private async applyTransferOrReclassification(
        createDto: CreateBudgetModificationDto,
        detailedActivity: DetailedActivity,
        queryRunner: any
    ): Promise<BudgetModification> {
        if (!createDto.newRubricId) {
            throw new BadRequestException({ message: "newRubricId es requerido para TRASLADOS o RECLASIFICACIONES", code: ErrorCodes.BUDGET_MODIFICATION_INVALID_VALUE });
        }
        if (createDto.newRubricId === detailedActivity.rubricId) {
            throw new BadRequestException({ message: "El nuevo rubro no puede ser igual al actual.", code: ErrorCodes.BUDGET_MODIFICATION_SAME_RUBRIC });
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
        return queryRunner.manager.save(modification);
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
            throw new NotFoundException({ message: `Modificación con id ${id} no encontrada`, code: ErrorCodes.BUDGET_MODIFICATION_NOT_FOUND });
        }

        return modification;
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        this.logger.error(error);
    }
}
