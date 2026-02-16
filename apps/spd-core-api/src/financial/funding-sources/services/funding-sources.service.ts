import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { FundingSource } from "../entities/funding-source.entity";
import { CreateFundingSourceDto } from "../dtos/create-funding-source.dto";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType, buildChanges } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";

@Injectable()
export class FundingSourcesService {
    constructor(
        @InjectRepository(FundingSource)
        private readonly repo: Repository<FundingSource>,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(dto: CreateFundingSourceDto) {
        const fundingSource = this.repo.create({
            code: dto.code,
            name: dto.name,
        });
        const saved = await this.repo.save(fundingSource);

        await this.auditLog.logSuccess(AuditAction.FUNDING_SOURCE_CREATED, AuditEntityType.FUNDING_SOURCE, saved.id, {
            entityName: `${saved.code} - ${saved.name}`,
            system: SYSTEM_NAME,
            metadata: { code: saved.code, name: saved.name },
        });

        return saved;
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

        const sortableFields = ["createAt", "updateAt", "code", "name"];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const queryBuilder = this.repo.createQueryBuilder("fundingSource");

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("fundingSource.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("fundingSource.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        queryBuilder
            .orderBy(`fundingSource.${validSortBy}`, validSortOrder)
            .skip(skip)
            .take(limit);

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

    async findOne(id: string) {
        const fundingSource = await this.repo.findOne({ where: { id } });
        if (!fundingSource) throw new NotFoundException({ message: "Fuente de financiación no encontrada", code: ErrorCodes.FUNDING_SOURCE_NOT_FOUND });
        return fundingSource;
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.repo
            .createQueryBuilder("fundingSource")
            .select(["fundingSource.id", "fundingSource.code", "fundingSource.name"]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("fundingSource.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("fundingSource.name ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("fundingSource.code", "ASC")
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

    async update(id: string, dto: Partial<CreateFundingSourceDto>) {
        const fundingSource = await this.findOne(id);
        const oldData = { code: fundingSource.code, name: fundingSource.name };
        if (dto.code !== undefined) fundingSource.code = dto.code;
        if (dto.name !== undefined) fundingSource.name = dto.name;
        const saved = await this.repo.save(fundingSource);

        await this.auditLog.logSuccess(AuditAction.FUNDING_SOURCE_UPDATED, AuditEntityType.FUNDING_SOURCE, saved.id, {
            entityName: `${saved.code} - ${saved.name}`,
            system: SYSTEM_NAME,
            changes: buildChanges(oldData, saved, ["code", "name"]),
        });

        return saved;
    }

    async delete(id: string) {
        const fundingSource = await this.findOne(id);
        await this.repo.remove(fundingSource);

        await this.auditLog.logSuccess(AuditAction.FUNDING_SOURCE_DELETED, AuditEntityType.FUNDING_SOURCE, id, {
            entityName: `${fundingSource.code} - ${fundingSource.name}`,
            system: SYSTEM_NAME,
        });

        return { message: "Fuente de financiación eliminada exitosamente" };
    }
}
