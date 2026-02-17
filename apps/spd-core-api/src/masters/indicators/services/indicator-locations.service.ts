import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets, SelectQueryBuilder } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { buildPaginatedMeta, emptyPaginatedResponse, calculateSkip } from "../../../shared/helpers";
import { IndicatorLocation } from "../entities/indicator-location.entity";
import { Location } from "../../locations/entities/location.entity";
import { IndicativePlanIndicator } from "../entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../entities/action-plan/action-plan-indicator.entity";
import { VariableLocation } from "../../variables/entities/variable-location.entity";
import { Commune } from "../../locations/entities/commune.entity";
import { VariableActionRelation } from "../entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../entities/indicative-plan/variable-indicative-relation.entity";

type IndicatorType = "action" | "indicative";

interface IndicatorTypeConfig {
    indicatorIdField: "actionIndicatorId" | "indicativeIndicatorId";
    indicatorRepo: Repository<ActionPlanIndicator> | Repository<IndicativePlanIndicator>;
    variableRelationRepo: Repository<VariableActionRelation> | Repository<VariableIndicativeRelation>;
    notFoundCode: string;
    notFoundMessage: string;
    variableRelationAlias: string;
    buildAllQuery: () => SelectQueryBuilder<any>;
}

@Injectable()
export class IndicatorLocationsService {
    private readonly logger = new Logger(IndicatorLocationsService.name);

    constructor(
        @InjectRepository(IndicatorLocation)
        private readonly indicatorLocationRepository: Repository<IndicatorLocation>,
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicativePlanIndicatorRepository: Repository<IndicativePlanIndicator>,
        @InjectRepository(ActionPlanIndicator)
        private readonly actionPlanIndicatorRepository: Repository<ActionPlanIndicator>,
        @InjectRepository(VariableLocation)
        private readonly variableLocationRepository: Repository<VariableLocation>,
        @InjectRepository(Commune)
        private readonly communeRepository: Repository<Commune>,
        @InjectRepository(VariableActionRelation)
        private readonly variableActionRelationRepository: Repository<VariableActionRelation>,
        @InjectRepository(VariableIndicativeRelation)
        private readonly variableIndicativeRelationRepository: Repository<VariableIndicativeRelation>,
        private readonly auditLog: AuditLogService,
    ) { }

    private getTypeConfig(type: IndicatorType): IndicatorTypeConfig {
        if (type === "action") {
            return {
                indicatorIdField: "actionIndicatorId",
                indicatorRepo: this.actionPlanIndicatorRepository,
                variableRelationRepo: this.variableActionRelationRepository,
                notFoundCode: ErrorCodes.ACTION_INDICATOR_NOT_FOUND,
                notFoundMessage: "Indicador de acción",
                variableRelationAlias: "var",
                buildAllQuery: () => this.actionPlanIndicatorRepository
                    .createQueryBuilder("ind")
                    .leftJoinAndSelect("ind.unitMeasure", "um"),
            };
        }
        return {
            indicatorIdField: "indicativeIndicatorId",
            indicatorRepo: this.indicativePlanIndicatorRepository,
            variableRelationRepo: this.variableIndicativeRelationRepository,
            notFoundCode: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND,
            notFoundMessage: "Indicador indicativo",
            variableRelationAlias: "vir",
            buildAllQuery: () => this.indicativePlanIndicatorRepository
                .createQueryBuilder("ind")
                .leftJoinAndSelect("ind.unitMeasure", "um")
                .leftJoinAndSelect("ind.indicatorType", "it")
                .leftJoinAndSelect("ind.direction", "dir"),
        };
    }

    private async addLocation(indicatorId: string, locationId: string, type: IndicatorType): Promise<IndicatorLocation> {
        const config = this.getTypeConfig(type);

        const indicator = await (config.indicatorRepo as Repository<any>).findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `${config.notFoundMessage} con id ${indicatorId} no encontrado`, code: config.notFoundCode });
        }

        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException({ message: `Ubicación con id ${locationId} no encontrada`, code: ErrorCodes.LOCATION_NOT_FOUND });
        }

        const existing = await this.indicatorLocationRepository.findOne({
            where: { [config.indicatorIdField]: indicatorId, locationId }
        });
        if (existing) {
            throw new BadRequestException({ message: "Esta ubicación ya está asociada al indicador", code: ErrorCodes.INDICATOR_LOCATION_ALREADY_EXISTS });
        }

        const relation = this.indicatorLocationRepository.create({
            [config.indicatorIdField]: indicatorId,
            locationId,
        });

        const saved = await this.indicatorLocationRepository.save(relation);

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_ADDED, AuditEntityType.INDICATOR_LOCATION, saved.id, {
            entityName: `${indicator.code ?? indicatorId} - ${location.address ?? locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type },
        });

        return saved;
    }

    private async removeLocation(indicatorId: string, locationId: string, type: IndicatorType): Promise<void> {
        const config = this.getTypeConfig(type);

        const relation = await this.indicatorLocationRepository.findOne({
            where: { [config.indicatorIdField]: indicatorId, locationId }
        });

        if (!relation) {
            throw new NotFoundException({ message: "Relación no encontrada", code: ErrorCodes.INDICATOR_LOCATION_NOT_FOUND });
        }

        const relationId = relation.id;
        await this.indicatorLocationRepository.remove(relation);

        const indicator = await (config.indicatorRepo as Repository<any>).findOne({ where: { id: indicatorId } });
        const location = await this.locationRepository.findOne({ where: { id: locationId } });

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_REMOVED, AuditEntityType.INDICATOR_LOCATION, relationId, {
            entityName: `${indicator?.code ?? indicatorId} - ${location?.address ?? locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type },
        });
    }

    private async findByIndicator(indicatorId: string, type: IndicatorType) {
        const config = this.getTypeConfig(type);
        const relations = await this.indicatorLocationRepository.find({
            where: { [config.indicatorIdField]: indicatorId },
            relations: ["location", "location.commune"],
            order: { createAt: "DESC" },
        });

        return relations.map(r => ({
            id: r.id,
            locationId: r.locationId,
            location: r.location,
            createAt: r.createAt,
        }));
    }

    async addLocationToIndicativeIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        return this.addLocation(indicatorId, locationId, "indicative");
    }

    async addLocationToActionIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        return this.addLocation(indicatorId, locationId, "action");
    }

    async removeLocationFromIndicativeIndicator(indicatorId: string, locationId: string): Promise<void> {
        return this.removeLocation(indicatorId, locationId, "indicative");
    }

    async removeLocationFromActionIndicator(indicatorId: string, locationId: string): Promise<void> {
        return this.removeLocation(indicatorId, locationId, "action");
    }

    async findByIndicativeIndicator(indicatorId: string) {
        return this.findByIndicator(indicatorId, "indicative");
    }

    async findByActionIndicator(indicatorId: string) {
        return this.findByIndicator(indicatorId, "action");
    }

    private applyIndicatorSearchFilter(queryBuilder: SelectQueryBuilder<any>, search?: string) {
        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("ind.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.description ILIKE :search", { search: `%${search}%` });
            }));
        }
    }

    private async findIndicatorsByCommuneCode(
        communeCode: string,
        type: IndicatorType,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        const skip = calculateSkip(page, limit);
        const config = this.getTypeConfig(type);

        // Si es 'all', traer todos los indicadores
        if (communeCode.toLowerCase() === "all") {
            const queryBuilder = config.buildAllQuery();
            this.applyIndicatorSearchFilter(queryBuilder, search);

            const [indicators, total] = await queryBuilder
                .orderBy("ind.code", "ASC")
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            return {
                data: indicators.map(ind => ({ ...ind, matchSource: "all" })),
                meta: buildPaginatedMeta(total, page, limit),
            };
        }

        // Verificar que la comuna existe
        const commune = await this.communeRepository.findOne({ where: { code: communeCode } });
        if (!commune) {
            throw new NotFoundException({ message: `Comuna con código ${communeCode} no encontrada`, code: ErrorCodes.COMMUNE_NOT_FOUND });
        }

        // 1. Indicadores con ubicación directa en la comuna
        const directIndicatorIds = await this.indicatorLocationRepository
            .createQueryBuilder("il")
            .innerJoin("il.location", "loc")
            .innerJoin("loc.commune", "com")
            .where("com.code = :communeCode", { communeCode })
            .andWhere(`il.${config.indicatorIdField} IS NOT NULL`)
            .select(`DISTINCT il.${config.indicatorIdField}`, "indicatorId")
            .getRawMany();

        // 2. Indicadores cuyas variables tienen ubicaciones en la comuna
        const variableIndicatorIds = await (config.variableRelationRepo as Repository<any>)
            .createQueryBuilder(config.variableRelationAlias)
            .innerJoin(VariableLocation, "vl", `vl.variableId = ${config.variableRelationAlias}.variableId`)
            .innerJoin("vl.location", "loc")
            .innerJoin("loc.commune", "com")
            .where("com.code = :communeCode", { communeCode })
            .select(`DISTINCT ${config.variableRelationAlias}.indicatorId`, "indicatorId")
            .getRawMany();

        // Combinar IDs únicos
        const allIds = new Set<string>([
            ...directIndicatorIds.map(r => r.indicatorId),
            ...variableIndicatorIds.map(r => r.indicatorId),
        ]);

        if (allIds.size === 0) {
            return emptyPaginatedResponse(page, limit);
        }

        // Query con paginación y búsqueda
        const queryBuilder = config.buildAllQuery()
            .where("ind.id IN (:...ids)", { ids: Array.from(allIds) });

        this.applyIndicatorSearchFilter(queryBuilder, search);

        const [indicators, total] = await queryBuilder
            .orderBy("ind.code", "ASC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data: indicators.map(ind => ({
                ...ind,
                matchSource: directIndicatorIds.some(d => d.indicatorId === ind.id) ? "direct" : "variable",
            })),
            meta: buildPaginatedMeta(total, page, limit),
        };
    }

    /**
     * Busca indicadores de acción por código de comuna
     */
    async findActionIndicatorsByCommuneCode(communeCode: string, page: number = 1, limit: number = 10, search?: string) {
        return this.findIndicatorsByCommuneCode(communeCode, "action", page, limit, search);
    }

    /**
     * Busca indicadores indicativos por código de comuna
     */
    async findIndicativeIndicatorsByCommuneCode(communeCode: string, page: number = 1, limit: number = 10, search?: string) {
        return this.findIndicatorsByCommuneCode(communeCode, "indicative", page, limit, search);
    }

    /**
     * Busca variables asociadas a un indicador que compartan la misma comuna o ubicación (genérico)
     */
    private async findVariablesByIndicatorLocation(
        indicatorId: string,
        type: IndicatorType,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        const config = this.getTypeConfig(type);

        const indicator = await (config.indicatorRepo as Repository<any>).findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `${config.notFoundMessage} con id ${indicatorId} no encontrado`, code: config.notFoundCode });
        }

        const skip = calculateSkip(page, limit);

        const indicatorLocations = await this.indicatorLocationRepository.find({
            where: { [config.indicatorIdField]: indicatorId },
            relations: ["location", "location.commune"],
        });

        if (indicatorLocations.length === 0) {
            return emptyPaginatedResponse(page, limit);
        }

        const locationIds = indicatorLocations.map(il => il.locationId);
        const communeIds = [...new Set(indicatorLocations.map(il => il.location.communeId))];

        const variableRelations = await (config.variableRelationRepo as Repository<any>).find({
            where: { indicatorId },
            relations: ["variable"],
        });

        if (variableRelations.length === 0) {
            return emptyPaginatedResponse(page, limit);
        }

        const variableIds = variableRelations.map(vr => vr.variableId);

        const queryBuilder = this.variableLocationRepository
            .createQueryBuilder("vl")
            .innerJoinAndSelect("vl.variable", "var")
            .innerJoinAndSelect("vl.location", "loc")
            .innerJoinAndSelect("loc.commune", "com")
            .where("vl.variableId IN (:...variableIds)", { variableIds })
            .andWhere("(vl.locationId IN (:...locationIds) OR loc.communeId IN (:...communeIds))", {
                locationIds,
                communeIds,
            });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("var.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("var.name ILIKE :search", { search: `%${search}%` });
            }));
        }

        const matchingVariableLocations = await queryBuilder.getMany();

        const variableMap = new Map<string, { variable: any; matchType: string }>();

        for (const vl of matchingVariableLocations) {
            const matchType = locationIds.includes(vl.locationId) ? "location" : "commune";

            if (!variableMap.has(vl.variableId)) {
                variableMap.set(vl.variableId, { variable: vl.variable, matchType });
            }

            if (matchType === "location") {
                variableMap.get(vl.variableId)!.matchType = "location";
            }
        }

        const allResults = Array.from(variableMap.values());
        const total = allResults.length;
        const data = allResults.slice(skip, skip + limit);

        return {
            data,
            meta: buildPaginatedMeta(total, page, limit),
        };
    }

    /**
     * Busca variables asociadas a un indicador de acción que compartan la misma comuna o ubicación
     */
    async findVariablesByActionIndicatorLocation(indicatorId: string, page: number = 1, limit: number = 10, search?: string) {
        return this.findVariablesByIndicatorLocation(indicatorId, "action", page, limit, search);
    }

    /**
     * Busca variables asociadas a un indicador indicativo que compartan la misma comuna o ubicación
     */
    async findVariablesByIndicativeIndicatorLocation(indicatorId: string, page: number = 1, limit: number = 10, search?: string) {
        return this.findVariablesByIndicatorLocation(indicatorId, "indicative", page, limit, search);
    }
}
