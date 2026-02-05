import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { ActionPlanIndicator } from "../../entities/action-plan/action-plan-indicator.entity";
import { UnitMeasure } from "../../entities/common/unit-measure.entity";
import { CreateActionPlanIndicatorDto } from "../../dtos/action-plan/create-action-plan-indicator.dto";
import { UpdateActionPlanIndicatorDto } from "../../dtos/action-plan/update-action-plan-indicator.dto";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";

@Injectable()
export class ActionPlanIndicatorsService {
    private readonly logger = new Logger(ActionPlanIndicatorsService.name);

    constructor(
        @InjectRepository(ActionPlanIndicator)
        private readonly indicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(UnitMeasure)
        private readonly unitMeasureRepository: Repository<UnitMeasure>,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(createDto: CreateActionPlanIndicatorDto): Promise<ActionPlanIndicator> {
        try {
            if (createDto.code) {
                const existing = await this.indicatorRepository.findOne({ where: { code: createDto.code } });
                if (existing) {
                    throw new BadRequestException({ message: `El código ${createDto.code} ya existe para otro indicador.`, code: ErrorCodes.ACTION_INDICATOR_ALREADY_EXISTS });
                }
            }
            const indicator = this.indicatorRepository.create(createDto);
            const saved = await this.indicatorRepository.save(indicator);

            await this.auditLog.logSuccess(AuditAction.ACTION_INDICATOR_CREATED, AuditEntityType.ACTION_INDICATOR, saved.id, {
                entityName: `${saved.code} - ${saved.name}`,
                system: SYSTEM_NAME,
                metadata: { code: saved.code, name: saved.name },
            });

            return saved;
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
            "statisticalCode",
            "name",
            "sequenceNumber",
            "plannedQuantity",
            "executionCut",
            "compliancePercentage",
            "unitMeasure.name"
        ];

        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "code";

        const queryBuilder = this.indicatorRepository.createQueryBuilder("i")
            .leftJoin("i.unitMeasure", "unitMeasure")
            .addSelect(["i", "unitMeasure.id", "unitMeasure.name"]);

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("i.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("i.description ILIKE :search", { search: `%${search}%` })
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

    async findOne(id: string): Promise<ActionPlanIndicator> {
        const indicator = await this.indicatorRepository.findOne({
            where: { id },
            relations: ["unitMeasure"],
        });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicator with ID ${id} not found`, code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }
        return indicator;
    }

    async update(id: string, updateDto: UpdateActionPlanIndicatorDto): Promise<ActionPlanIndicator> {
        const indicator = await this.findOne(id);
        const oldData = { code: indicator.code, name: indicator.name };

        if (updateDto.code) {
            const existing = await this.indicatorRepository.findOne({ where: { code: updateDto.code } });
            if (existing && existing.id !== id) {
                throw new BadRequestException({ message: `El código ${updateDto.code} ya existe para otro indicador.`, code: ErrorCodes.ACTION_INDICATOR_ALREADY_EXISTS });
            }
        }
        Object.assign(indicator, updateDto);
        try {
            const saved = await this.indicatorRepository.save(indicator);

            await this.auditLog.logSuccess(AuditAction.ACTION_INDICATOR_UPDATED, AuditEntityType.ACTION_INDICATOR, saved.id, {
                entityName: `${saved.code} - ${saved.name}`,
                system: SYSTEM_NAME,
                changes: buildChanges(oldData, saved, ["code", "name"]),
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const indicator = await this.findOne(id);
        await this.indicatorRepository.remove(indicator);

        await this.auditLog.logSuccess(AuditAction.ACTION_INDICATOR_DELETED, AuditEntityType.ACTION_INDICATOR, id, {
            entityName: `${indicator.code} - ${indicator.name}`,
            system: SYSTEM_NAME,
        });
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        this.logger.error(error);
    }
}
