import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { IndicatorLocation } from "../entities/indicator-location.entity";
import { Location } from "../../locations/entities/location.entity";
import { IndicativePlanIndicator } from "../entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../entities/action-plan/action-plan-indicator.entity";
import { VariableLocation } from "../../variables/entities/variable-location.entity";
import { Commune } from "../../locations/entities/commune.entity";
import { VariableActionRelation } from "../entities/action-plan/variable-action-relation.entity";
import { VariableIndicativeRelation } from "../entities/indicative-plan/variable-indicative-relation.entity";

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

    async addLocationToIndicativeIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        // Verify indicator exists
        const indicator = await this.indicativePlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicador indicativo con id ${indicatorId} no encontrado`, code: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND });
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException({ message: `Ubicación con id ${locationId} no encontrada`, code: ErrorCodes.LOCATION_NOT_FOUND });
        }

        // Check if relation already exists
        const existing = await this.indicatorLocationRepository.findOne({
            where: { indicativeIndicatorId: indicatorId, locationId }
        });
        if (existing) {
            throw new BadRequestException({ message: "Esta ubicación ya está asociada al indicador", code: ErrorCodes.INDICATOR_LOCATION_ALREADY_EXISTS });
        }

        const relation = this.indicatorLocationRepository.create({
            indicativeIndicatorId: indicatorId,
            locationId,
        });

        const saved = await this.indicatorLocationRepository.save(relation);

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_ADDED, AuditEntityType.INDICATOR_LOCATION, saved.id, {
            entityName: `Indicative Indicator ${indicatorId} - Location ${locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type: 'indicative' },
        });

        return saved;
    }

    async addLocationToActionIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        // Verify indicator exists
        const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicador de acción con id ${indicatorId} no encontrado`, code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException({ message: `Ubicación con id ${locationId} no encontrada`, code: ErrorCodes.LOCATION_NOT_FOUND });
        }

        // Check if relation already exists
        const existing = await this.indicatorLocationRepository.findOne({
            where: { actionIndicatorId: indicatorId, locationId }
        });
        if (existing) {
            throw new BadRequestException({ message: "Esta ubicación ya está asociada al indicador", code: ErrorCodes.INDICATOR_LOCATION_ALREADY_EXISTS });
        }

        const relation = this.indicatorLocationRepository.create({
            actionIndicatorId: indicatorId,
            locationId,
        });

        const saved = await this.indicatorLocationRepository.save(relation);

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_ADDED, AuditEntityType.INDICATOR_LOCATION, saved.id, {
            entityName: `Action Indicator ${indicatorId} - Location ${locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type: 'action' },
        });

        return saved;
    }

    async removeLocationFromIndicativeIndicator(indicatorId: string, locationId: string): Promise<void> {
        const relation = await this.indicatorLocationRepository.findOne({
            where: { indicativeIndicatorId: indicatorId, locationId }
        });

        if (!relation) {
            throw new NotFoundException({ message: "Relación no encontrada", code: ErrorCodes.INDICATOR_LOCATION_NOT_FOUND });
        }

        const relationId = relation.id;
        await this.indicatorLocationRepository.remove(relation);

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_REMOVED, AuditEntityType.INDICATOR_LOCATION, relationId, {
            entityName: `Indicative Indicator ${indicatorId} - Location ${locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type: 'indicative' },
        });
    }

    async removeLocationFromActionIndicator(indicatorId: string, locationId: string): Promise<void> {
        const relation = await this.indicatorLocationRepository.findOne({
            where: { actionIndicatorId: indicatorId, locationId }
        });

        if (!relation) {
            throw new NotFoundException({ message: "Relación no encontrada", code: ErrorCodes.INDICATOR_LOCATION_NOT_FOUND });
        }

        const relationId = relation.id;
        await this.indicatorLocationRepository.remove(relation);

        await this.auditLog.logSuccess(AuditAction.INDICATOR_LOCATION_REMOVED, AuditEntityType.INDICATOR_LOCATION, relationId, {
            entityName: `Action Indicator ${indicatorId} - Location ${locationId}`,
            system: SYSTEM_NAME,
            metadata: { indicatorId, locationId, type: 'action' },
        });
    }

    async findByIndicativeIndicator(indicatorId: string) {
        const relations = await this.indicatorLocationRepository.find({
            where: { indicativeIndicatorId: indicatorId },
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

    async findByActionIndicator(indicatorId: string) {
        const relations = await this.indicatorLocationRepository.find({
            where: { actionIndicatorId: indicatorId },
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

    /**
     * Busca indicadores de acción por código de comuna
     * 1. Indicadores con ubicación directa en la comuna
     * 2. Indicadores cuyas variables tienen ubicaciones en la comuna
     * Si communeCode es 'all', retorna todos los indicadores
     */
    async findActionIndicatorsByCommuneCode(
        communeCode: string,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        // Si es 'all', traer todos los indicadores
        if (communeCode.toLowerCase() === "all") {
            const queryBuilder = this.actionPlanIndicatorRepository
                .createQueryBuilder("ind")
                .leftJoinAndSelect("ind.unitMeasure", "um");

            if (search) {
                queryBuilder.where(new Brackets((qb) => {
                    qb.where("ind.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("ind.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("ind.description ILIKE :search", { search: `%${search}%` });
                }));
            }

            const [indicators, total] = await queryBuilder
                .orderBy("ind.code", "ASC")
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            const data = indicators.map(ind => ({
                ...ind,
                matchSource: "all",
            }));

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
            .andWhere("il.actionIndicatorId IS NOT NULL")
            .select("DISTINCT il.actionIndicatorId", "indicatorId")
            .getRawMany();

        // 2. Indicadores cuyas variables tienen ubicaciones en la comuna
        const variableIndicatorIds = await this.variableActionRelationRepository
            .createQueryBuilder("var")
            .innerJoin(VariableLocation, "vl", "vl.variableId = var.variableId")
            .innerJoin("vl.location", "loc")
            .innerJoin("loc.commune", "com")
            .where("com.code = :communeCode", { communeCode })
            .select("DISTINCT var.indicatorId", "indicatorId")
            .getRawMany();

        // Combinar IDs únicos
        const allIds = new Set<string>([
            ...directIndicatorIds.map(r => r.indicatorId),
            ...variableIndicatorIds.map(r => r.indicatorId),
        ]);

        if (allIds.size === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        // Query con paginación y búsqueda
        const queryBuilder = this.actionPlanIndicatorRepository
            .createQueryBuilder("ind")
            .leftJoinAndSelect("ind.unitMeasure", "um")
            .where("ind.id IN (:...ids)", { ids: Array.from(allIds) });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("ind.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.description ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [indicators, total] = await queryBuilder
            .orderBy("ind.code", "ASC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        // Agregar información de origen (directo o por variable)
        const data = indicators.map(ind => ({
            ...ind,
            matchSource: directIndicatorIds.some(d => d.indicatorId === ind.id) ? "direct" : "variable",
        }));

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

    /**
     * Busca indicadores indicativos por código de comuna
     * 1. Indicadores con ubicación directa en la comuna
     * 2. Indicadores cuyas variables tienen ubicaciones en la comuna
     * Si communeCode es 'all', retorna todos los indicadores
     */
    async findIndicativeIndicatorsByCommuneCode(
        communeCode: string,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        // Si es 'all', traer todos los indicadores
        if (communeCode.toLowerCase() === "all") {
            const queryBuilder = this.indicativePlanIndicatorRepository
                .createQueryBuilder("ind")
                .leftJoinAndSelect("ind.unitMeasure", "um")
                .leftJoinAndSelect("ind.indicatorType", "it")
                .leftJoinAndSelect("ind.direction", "dir");

            if (search) {
                queryBuilder.where(new Brackets((qb) => {
                    qb.where("ind.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("ind.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("ind.description ILIKE :search", { search: `%${search}%` });
                }));
            }

            const [indicators, total] = await queryBuilder
                .orderBy("ind.code", "ASC")
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            const data = indicators.map(ind => ({
                ...ind,
                matchSource: "all",
            }));

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
            .andWhere("il.indicativeIndicatorId IS NOT NULL")
            .select("DISTINCT il.indicativeIndicatorId", "indicatorId")
            .getRawMany();

        // 2. Indicadores cuyas variables tienen ubicaciones en la comuna
        const variableIndicatorIds = await this.variableIndicativeRelationRepository
            .createQueryBuilder("vir")
            .innerJoin(VariableLocation, "vl", "vl.variableId = vir.variableId")
            .innerJoin("vl.location", "loc")
            .innerJoin("loc.commune", "com")
            .where("com.code = :communeCode", { communeCode })
            .select("DISTINCT vir.indicatorId", "indicatorId")
            .getRawMany();

        // Combinar IDs únicos
        const allIds = new Set<string>([
            ...directIndicatorIds.map(r => r.indicatorId),
            ...variableIndicatorIds.map(r => r.indicatorId),
        ]);

        if (allIds.size === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        // Query con paginación y búsqueda
        const queryBuilder = this.indicativePlanIndicatorRepository
            .createQueryBuilder("ind")
            .leftJoinAndSelect("ind.unitMeasure", "um")
            .leftJoinAndSelect("ind.indicatorType", "it")
            .leftJoinAndSelect("ind.direction", "dir")
            .where("ind.id IN (:...ids)", { ids: Array.from(allIds) });

        if (search) {
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where("ind.code ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.name ILIKE :search", { search: `%${search}%` })
                    .orWhere("ind.description ILIKE :search", { search: `%${search}%` });
            }));
        }

        const [indicators, total] = await queryBuilder
            .orderBy("ind.code", "ASC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        // Agregar información de origen (directo o por variable)
        const data = indicators.map(ind => ({
            ...ind,
            matchSource: directIndicatorIds.some(d => d.indicatorId === ind.id) ? "direct" : "variable",
        }));

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

    /**
     * Busca variables asociadas a un indicador de acción que compartan la misma comuna o ubicación
     */
    async findVariablesByActionIndicatorLocation(
        indicatorId: string,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        // Verificar que el indicador existe
        const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicador de acción con id ${indicatorId} no encontrado`, code: ErrorCodes.ACTION_INDICATOR_NOT_FOUND });
        }

        const skip = (page - 1) * limit;

        // Obtener las ubicaciones del indicador
        const indicatorLocations = await this.indicatorLocationRepository.find({
            where: { actionIndicatorId: indicatorId },
            relations: ["location", "location.commune"],
        });

        if (indicatorLocations.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        // Obtener IDs de ubicaciones y comunas del indicador
        const locationIds = indicatorLocations.map(il => il.locationId);
        const communeIds = [...new Set(indicatorLocations.map(il => il.location.communeId))];

        // Obtener variables asociadas al indicador
        const variableRelations = await this.variableActionRelationRepository.find({
            where: { indicatorId },
            relations: ["variable"],
        });

        if (variableRelations.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        const variableIds = variableRelations.map(vr => vr.variableId);

        // Buscar variable_locations que coincidan con las ubicaciones o comunas del indicador
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

        // Agrupar por variable y agregar info de match
        const variableMap = new Map<string, { variable: any; matchType: string }>();

        for (const vl of matchingVariableLocations) {
            const matchType = locationIds.includes(vl.locationId) ? "location" : "commune";

            if (!variableMap.has(vl.variableId)) {
                variableMap.set(vl.variableId, {
                    variable: vl.variable,
                    matchType,
                });
            }

            // Si encuentra match por location, es más específico que commune
            if (matchType === "location") {
                const entry = variableMap.get(vl.variableId)!;
                entry.matchType = "location";
            }
        }

        const allResults = Array.from(variableMap.values());
        const total = allResults.length;
        const totalPages = Math.ceil(total / limit);
        const data = allResults.slice(skip, skip + limit);

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

    /**
     * Busca variables asociadas a un indicador indicativo que compartan la misma comuna o ubicación
     */
    async findVariablesByIndicativeIndicatorLocation(
        indicatorId: string,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        // Verificar que el indicador existe
        const indicator = await this.indicativePlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicador indicativo con id ${indicatorId} no encontrado`, code: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND });
        }

        const skip = (page - 1) * limit;

        // Obtener las ubicaciones del indicador
        const indicatorLocations = await this.indicatorLocationRepository.find({
            where: { indicativeIndicatorId: indicatorId },
            relations: ["location", "location.commune"],
        });

        if (indicatorLocations.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        // Obtener IDs de ubicaciones y comunas del indicador
        const locationIds = indicatorLocations.map(il => il.locationId);
        const communeIds = [...new Set(indicatorLocations.map(il => il.location.communeId))];

        // Obtener variables asociadas al indicador
        const variableRelations = await this.variableIndicativeRelationRepository.find({
            where: { indicatorId },
            relations: ["variable"],
        });

        if (variableRelations.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            };
        }

        const variableIds = variableRelations.map(vr => vr.variableId);

        // Buscar variable_locations que coincidan con las ubicaciones o comunas del indicador
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

        // Agrupar por variable y agregar info de match
        const variableMap = new Map<string, { variable: any; matchType: string }>();

        for (const vl of matchingVariableLocations) {
            const matchType = locationIds.includes(vl.locationId) ? "location" : "commune";

            if (!variableMap.has(vl.variableId)) {
                variableMap.set(vl.variableId, {
                    variable: vl.variable,
                    matchType,
                });
            }

            // Si encuentra match por location, es más específico que commune
            if (matchType === "location") {
                const entry = variableMap.get(vl.variableId)!;
                entry.matchType = "location";
            }
        }

        const allResults = Array.from(variableMap.values());
        const total = allResults.length;
        const totalPages = Math.ceil(total / limit);
        const data = allResults.slice(skip, skip + limit);

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
}
