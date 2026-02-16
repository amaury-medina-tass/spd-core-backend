import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { SYSTEM_NAME } from "../../../../shared/constants";
import { IndicativePlanIndicatorQuadrennium } from "../../entities/indicative-plan/indicative-plan-indicator-quadrennium.entity";
import { IndicativePlanIndicator } from "../../entities/indicative-plan/indicative-plan-indicator.entity";
import { CreateIndicativePlanIndicatorQuadrenniumDto, UpdateIndicativePlanIndicatorQuadrenniumDto } from "../../dtos/indicative-plan/create-indicative-plan-indicator-quadrennium.dto";

@Injectable()
export class IndicativePlanIndicatorQuadrenniumsService {
    private readonly logger = new Logger(IndicativePlanIndicatorQuadrenniumsService.name);

    constructor(
        @InjectRepository(IndicativePlanIndicatorQuadrennium)
        private readonly quadrenniumRepository: Repository<IndicativePlanIndicatorQuadrennium>,
        @InjectRepository(IndicativePlanIndicator)
        private readonly indicatorRepository: Repository<IndicativePlanIndicator>,
        private readonly auditLog: AuditLogService,
    ) { }

    async create(createDto: CreateIndicativePlanIndicatorQuadrenniumDto): Promise<IndicativePlanIndicatorQuadrennium> {
        const { indicatorId } = createDto;

        const indicator = await this.indicatorRepository.findOne({ where: { id: indicatorId } });
        if (!indicator) {
            throw new NotFoundException({ message: `Indicador con ID ${indicatorId} no encontrado`, code: ErrorCodes.INDICATIVE_INDICATOR_NOT_FOUND });
        }

        try {
            const quadrennium = this.quadrenniumRepository.create(createDto);
            const saved = await this.quadrenniumRepository.save(quadrennium);

            await this.auditLog.logSuccess(AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_CREATED, AuditEntityType.INDICATIVE_INDICATOR_QUADRENNIUM, saved.id, {
                entityName: `Indicative Quadrennium ${saved.startYear}-${saved.endYear}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId, startYear: saved.startYear, endYear: saved.endYear, value: saved.value },
            });

            return saved;
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
            throw new NotFoundException({ message: `Quadrennium with ID ${id} not found`, code: ErrorCodes.INDICATIVE_INDICATOR_QUADRENNIUM_NOT_FOUND });
        }
        return quadrennium;
    }

    async update(id: string, updateDto: UpdateIndicativePlanIndicatorQuadrenniumDto): Promise<IndicativePlanIndicatorQuadrennium> {
        const quadrennium = await this.findOne(id);
        Object.assign(quadrennium, updateDto);
        try {
            const saved = await this.quadrenniumRepository.save(quadrennium);

            await this.auditLog.logSuccess(AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_UPDATED, AuditEntityType.INDICATIVE_INDICATOR_QUADRENNIUM, saved.id, {
                entityName: `Indicative Quadrennium ${saved.startYear}-${saved.endYear}`,
                system: SYSTEM_NAME,
                metadata: { indicatorId: saved.indicatorId, startYear: saved.startYear, endYear: saved.endYear, value: saved.value },
            });

            return saved;
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const quadrennium = await this.findOne(id);
        await this.quadrenniumRepository.remove(quadrennium);

        await this.auditLog.logSuccess(AuditAction.INDICATIVE_INDICATOR_QUADRENNIUM_DELETED, AuditEntityType.INDICATIVE_INDICATOR_QUADRENNIUM, id, {
            entityName: `Indicative Quadrennium ${quadrennium.startYear}-${quadrennium.endYear}`,
            system: SYSTEM_NAME,
        });
    }

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException("Ya existe un cuatrienio para este indicador y rango de años.");
        }
        this.logger.error(error);
    }
}
