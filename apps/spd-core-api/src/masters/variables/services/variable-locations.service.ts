import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../shared/constants";
import { VariableLocation } from "../entities/variable-location.entity";
import { Variable } from "../entities/variable.entity";
import { Location } from "../../locations/entities/location.entity";

@Injectable()
export class VariableLocationsService {
    private readonly logger = new Logger(VariableLocationsService.name);

    constructor(
        @InjectRepository(VariableLocation)
        private readonly variableLocationRepository: Repository<VariableLocation>,
        @InjectRepository(Variable)
        private readonly variableRepository: Repository<Variable>,
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
        private readonly auditLog: AuditLogService,
    ) { }

    async addLocation(variableId: string, locationId: string): Promise<VariableLocation> {
        // Verify variable exists
        const variable = await this.variableRepository.findOne({ where: { id: variableId } });
        if (!variable) {
            throw new NotFoundException({ message: `Variable con id ${variableId} no encontrada`, code: ErrorCodes.VARIABLE_NOT_FOUND });
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException({ message: `Ubicación con id ${locationId} no encontrada`, code: ErrorCodes.LOCATION_NOT_FOUND });
        }

        // Check if relation already exists
        const existing = await this.variableLocationRepository.findOne({
            where: { variableId, locationId }
        });
        if (existing) {
            throw new BadRequestException({ message: "Esta ubicación ya está asociada a la variable", code: ErrorCodes.VARIABLE_LOCATION_ALREADY_EXISTS });
        }

        const relation = this.variableLocationRepository.create({
            variableId,
            locationId,
        });

        const saved = await this.variableLocationRepository.save(relation);

        await this.auditLog.logSuccess(AuditAction.VARIABLE_LOCATION_ADDED, AuditEntityType.VARIABLE_LOCATION, saved.id, {
            entityName: `${variable.code} - ${location.address ?? locationId}`,
            system: SYSTEM_NAME,
            metadata: { variableId, locationId },
        });

        return saved;
    }

    async removeLocation(variableId: string, locationId: string): Promise<void> {
        const relation = await this.variableLocationRepository.findOne({
            where: { variableId, locationId }
        });

        if (!relation) {
            throw new NotFoundException({ message: "Relación no encontrada", code: ErrorCodes.VARIABLE_LOCATION_NOT_FOUND });
        }

        const variable = await this.variableRepository.findOne({ where: { id: variableId } });
        const location = await this.locationRepository.findOne({ where: { id: locationId } });

        const relationId = relation.id;
        await this.variableLocationRepository.remove(relation);

        await this.auditLog.logSuccess(AuditAction.VARIABLE_LOCATION_REMOVED, AuditEntityType.VARIABLE_LOCATION, relationId, {
            entityName: `${variable?.code ?? variableId} - ${location?.address ?? locationId}`,
            system: SYSTEM_NAME,
            metadata: { variableId, locationId },
        });
    }

    async findByVariable(variableId: string) {
        const relations = await this.variableLocationRepository.find({
            where: { variableId },
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
}
