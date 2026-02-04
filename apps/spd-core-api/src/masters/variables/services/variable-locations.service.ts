import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
    ) { }

    async addLocation(variableId: string, locationId: string): Promise<VariableLocation> {
        // Verify variable exists
        const variable = await this.variableRepository.findOne({ where: { id: variableId } });
        if (!variable) {
            throw new NotFoundException(`Variable con id ${variableId} no encontrada`);
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException(`Ubicación con id ${locationId} no encontrada`);
        }

        // Check if relation already exists
        const existing = await this.variableLocationRepository.findOne({
            where: { variableId, locationId }
        });
        if (existing) {
            throw new BadRequestException("Esta ubicación ya está asociada a la variable");
        }

        const relation = this.variableLocationRepository.create({
            variableId,
            locationId,
        });

        return await this.variableLocationRepository.save(relation);
    }

    async removeLocation(variableId: string, locationId: string): Promise<void> {
        const relation = await this.variableLocationRepository.findOne({
            where: { variableId, locationId }
        });

        if (!relation) {
            throw new NotFoundException("Relación no encontrada");
        }

        await this.variableLocationRepository.remove(relation);
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
