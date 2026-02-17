import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@common/cosmosdb/audit-log.service";
import { AuditAction, AuditEntityType } from "@common/types/audit.types";
import { ErrorCodes } from "@common/errors/error-codes";
import { VariableQuadrennium } from "../entities/variable-quadrennium.entity";
import { Variable } from "../entities/variable.entity";
import { BaseIndicatorQuadrenniumsService, IndicatorQuadrenniumsConfig } from "../../indicators/services/base";

@Injectable()
export class VariableQuadrenniumsService extends BaseIndicatorQuadrenniumsService<VariableQuadrennium, Variable> {
    protected readonly logger = new Logger(VariableQuadrenniumsService.name);
    protected readonly config: IndicatorQuadrenniumsConfig = {
        quadrenniumNotFoundCode: ErrorCodes.VARIABLE_QUADRENNIUM_NOT_FOUND,
        auditCreateAction: AuditAction.VARIABLE_QUADRENNIUM_CREATED,
        auditUpdateAction: AuditAction.VARIABLE_QUADRENNIUM_UPDATED,
        auditDeleteAction: AuditAction.VARIABLE_QUADRENNIUM_DELETED,
        auditEntityType: AuditEntityType.VARIABLE_QUADRENNIUM,
        quadrenniumLabel: "Variable Quadrennium",
        parentRelation: "variable",
        parentIdField: "variableId",
        checkParentOnCreate: false,
        validateYearRange: true,
        duplicateMessage: "Ya existe una meta (cuatrenio) para esta variable en el rango de años especificado",
        alias: "vq",
        startYearColumn: "startYear",
        endYearColumn: "endYear",
    };

    constructor(
        @InjectRepository(VariableQuadrennium)
        protected readonly quadrenniumRepository: Repository<VariableQuadrennium>,
        protected readonly auditLog: AuditLogService,
    ) {
        super();
    }
}
