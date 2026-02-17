import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Variable } from "../entities/variable.entity";
import { CreateVariableDto } from "../dtos/create-variable.dto";
import { UpdateVariableDto } from "../dtos/update-variable.dto";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { buildPaginatedMeta, executeFindForSelect, calculateSkip, validateSortParams } from "../../../shared/helpers";

@Injectable()
export class VariablesService {
    private readonly logger = new Logger(VariablesService.name);

    constructor(
        @InjectRepository(Variable)
        private readonly variableRepository: Repository<Variable>,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(createDto: CreateVariableDto): Promise<Variable> {
        try {
            const variable = this.variableRepository.create(createDto);
            const saved = await this.variableRepository.save(variable);

            await this.auditLog.logSuccess(AuditAction.VARIABLE_CREATED, AuditEntityType.VARIABLE, saved.id, {
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
        const skip = calculateSkip(page, limit);
        const sortableFields = ["createAt", "updateAt", "code", "name", "observations"];
        const { validSortBy, validSortOrder } = validateSortParams(sortBy, sortOrder, sortableFields);

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

        return { data, meta: buildPaginatedMeta(total, page, limit) };
    }

    async findOne(id: string): Promise<Variable> {
        const variable = await this.variableRepository.findOne({
            where: { id },
        });

        if (!variable) {
            throw new NotFoundException({ message: `Variable with id ${id} not found`, code: ErrorCodes.VARIABLE_NOT_FOUND });
        }

        return variable;
    }

    async update(id: string, updateDto: UpdateVariableDto): Promise<Variable> {
        const oldVariable = await this.findOne(id);
        const oldData = { code: oldVariable.code, name: oldVariable.name, observations: oldVariable.observations };

        const variable = await this.variableRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!variable) {
            throw new NotFoundException({ message: `Variable with id ${id} not found`, code: ErrorCodes.VARIABLE_NOT_FOUND });
        }

        try {
            const saved = await this.variableRepository.save(variable);

            await this.auditLog.logSuccess(AuditAction.VARIABLE_UPDATED, AuditEntityType.VARIABLE, saved.id, {
                entityName: `${saved.code} - ${saved.name}`,
                system: SYSTEM_NAME,
                changes: buildChanges(oldData, saved, ["code", "name", "observations"]),
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const variable = await this.findOne(id);
        await this.variableRepository.remove(variable);

        await this.auditLog.logSuccess(AuditAction.VARIABLE_DELETED, AuditEntityType.VARIABLE, id, {
            entityName: `${variable.code} - ${variable.name}`,
            system: SYSTEM_NAME,
        });
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
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

        return executeFindForSelect({
            queryBuilder,
            applySearch: (qb, s) => {
                qb.where(
                    new Brackets((b) => {
                        b.where("variable.code ILIKE :search", { search: `%${s}%` })
                            .orWhere("variable.name ILIKE :search", { search: `%${s}%` });
                    })
                );
            },
            orderBy: [["variable.createAt", "DESC"]],
            search,
            limit,
            offset,
        });
    }
}
