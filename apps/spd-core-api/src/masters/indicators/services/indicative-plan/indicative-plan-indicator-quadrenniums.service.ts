import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndicativePlanIndicatorQuadrennium } from "../../entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { CreateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";
import { UpdateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";

@Injectable()
export class IndicativePlanIndicatorQuadrenniumsService {
    private readonly logger = new Logger(IndicativePlanIndicatorQuadrenniumsService.name);

    constructor(
        @InjectRepository(IndicativePlanIndicatorQuadrennium)
        private readonly quadrenniumRepository: Repository<IndicativePlanIndicatorQuadrennium>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicatorRepository: Repository<IndicativePlanIndicator>,
    ) { }

    async create(createDto: CreateIndicativePlanIndicatorQuadrenniumDto): Promise<IndicativePlanIndicatorQuadrennium> {
        const { indicatorId } = createDto;

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException(`Indicador con ID ${indicatorId} no encontrado`);
        }

        try {
            const quadrennium = this.quadrenniumRepository.create(createDto);
            return await this.quadrenniumRepository.save(quadrennium);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findAllByIndicator(indicatorId: string): Promise<IndicativePlanIndicatorQuadrennium[]> {
        return this.quadrenniumRepository.find({
            where: { indicatorId },
            order: { startYear: "ASC" },
        });
    }

    async findOne(id: string): Promise<IndicativePlanIndicatorQuadrennium> {
        const quadrennium = await this.quadrenniumRepository.findOne({ where: { id } });
        if (!quadrennium) {
            throw new NotFoundException(`Quadrennium with ID ${id} not found`);
        }
        return quadrennium;
    }

    async update(id: string, updateDto: UpdateIndicativePlanIndicatorQuadrenniumDto): Promise<IndicativePlanIndicatorQuadrennium> {
        const quadrennium = await this.findOne(id);
        Object.assign(quadrennium, updateDto);
        try {
            return await this.quadrenniumRepository.save(quadrennium);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const quadrennium = await this.findOne(id);
        await this.quadrenniumRepository.remove(quadrennium);
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe un cuatrienio para este indicador y rango de años.");
        }
        this.logger.error(error);
    }
}
