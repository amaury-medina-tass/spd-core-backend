import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndicatorLocation } from "../entities/indicator-location.entity";
import { Location } from "../../locations/entities/location.entity";
import { IndicativePlanIndicator } from "../entities/indicative-plan/indicative-plan-indicator.entity";
import { ActionPlanIndicator } from "../entities/action-plan/action-plan-indicator.entity";

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
    ) { }

    async addLocationToIndicativeIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        // Verify indicator exists
        const indicator = await this.indicativePlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicador indicativo con id ${indicatorId} no encontrado`);
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException(`Ubicación con id ${locationId} no encontrada`);
        }

        // Check if relation already exists
        const existing = await this.indicatorLocationRepository.findOne({
            where: { indicativeIndicatorId: indicatorId, locationId }
        });
        if (existing) {
            throw new BadRequestException("Esta ubicación ya está asociada al indicador");
        }

        const relation = this.indicatorLocationRepository.create({
            indicativeIndicatorId: indicatorId,
            locationId,
        });

        return await this.indicatorLocationRepository.save(relation);
    }

    async addLocationToActionIndicator(indicatorId: string, locationId: string): Promise<IndicatorLocation> {
        // Verify indicator exists
        const indicator = await this.actionPlanIndicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicador de acción con id ${indicatorId} no encontrado`);
        }

        // Verify location exists
        const location = await this.locationRepository.findOne({ where: { id: locationId } });
        if (!location) {
            throw new NotFoundException(`Ubicación con id ${locationId} no encontrada`);
        }

        // Check if relation already exists
        const existing = await this.indicatorLocationRepository.findOne({
            where: { actionIndicatorId: indicatorId, locationId }
        });
        if (existing) {
            throw new BadRequestException("Esta ubicación ya está asociada al indicador");
        }

        const relation = this.indicatorLocationRepository.create({
            actionIndicatorId: indicatorId,
            locationId,
        });

        return await this.indicatorLocationRepository.save(relation);
    }

    async removeLocationFromIndicativeIndicator(indicatorId: string, locationId: string): Promise<void> {
        const relation = await this.indicatorLocationRepository.findOne({
            where: { indicativeIndicatorId: indicatorId, locationId }
        });

        if (!relation) {
            throw new NotFoundException("Relación no encontrada");
        }

        await this.indicatorLocationRepository.remove(relation);
    }

    async removeLocationFromActionIndicator(indicatorId: string, locationId: string): Promise<void> {
        const relation = await this.indicatorLocationRepository.findOne({
            where: { actionIndicatorId: indicatorId, locationId }
        });

        if (!relation) {
            throw new NotFoundException("Relación no encontrada");
        }

        await this.indicatorLocationRepository.remove(relation);
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
}
