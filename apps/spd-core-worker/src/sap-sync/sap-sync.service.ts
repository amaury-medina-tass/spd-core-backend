import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { SapContract } from './sap-api.service';

// Importar entidades desde spd-core-api
import { Dependency } from '../../../spd-core-api/src/financial/dependencies/entities/dependency.entity';
import { Contractor } from '../../../spd-core-api/src/financial/contractors/entities/contractor.entity';
import { FundingSource } from '../../../spd-core-api/src/financial/funding-sources/entities/funding-source.entity';
import { Rubric } from '../../../spd-core-api/src/masters/rubrics/entities/rubric.entity';
import { Project } from '../../../spd-core-api/src/financial/projects/entities/project.entity';
import { PreviousStudy } from '../../../spd-core-api/src/financial/previous-studies/entities/previous-study.entity';
import { Need } from '../../../spd-core-api/src/financial/needs/entities/need.entity';
import { Cdp } from '../../../spd-core-api/src/financial/cdps/entities/cdp.entity';
import { CdpProject } from '../../../spd-core-api/src/financial/cdps/entities/cdp-project.entity';
import { CdpPosition } from '../../../spd-core-api/src/financial/cdps/entities/cdp-position.entity';
import { MasterContract } from '../../../spd-core-api/src/financial/master-contracts/entities/master-contract.entity';
import { ContractCdpRelation } from '../../../spd-core-api/src/financial/contract-cdp-relations/entities/contract-cdp-relation.entity';
import { ContractPosition } from '../../../spd-core-api/src/financial/contract-positions/entities/contract-position.entity';

@Injectable()
export class SapSyncService {
    private readonly logger = new Logger(SapSyncService.name);

    constructor(private dataSource: DataSource) { }

    /**
     * Procesa la lista de items SAP y sincroniza con la base de datos.
     * Usa una transacción para garantizar consistencia.
     */
    async processSapItems(items: SapContract[]): Promise<void> {
        this.logger.log(`Iniciando sincronización de ${items.length} items...`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const item of items) {
                await this.syncSingleItem(item, queryRunner);
            }
            await queryRunner.commitTransaction();
            this.logger.log(`✅ Sincronización finalizada. Procesados ${items.length} items.`);
        } catch (err: any) {
            this.logger.error('❌ Error en la sincronización masiva', err.stack);
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async syncSingleItem(item: SapContract, runner: QueryRunner): Promise<void> {
        // Extracción de datos del item SAP
        const depCode = item.centroGestor;
        const depName = item.descCentroGestor || item.secretaria;

        const contNit = item.nitContratista;
        const contName = item.nombreContratista;
        const contEmail = item.email;
        const contAddress = item.direccion;
        const contPhone = item.telefono;

        const fundCode = item.codigoFondo;
        const fundName = item.descripcionFondo;

        const rubricCode = item.pospre;

        const projCode = item.proyecto;
        const projName = item.nombreProyecto;

        const psCode = item.estudioPrevio;
        const needCode = item.necesidad;
        const needValue = this.parseMoney(item.valorNecesidad);

        const cdpNum = item.cdp;
        const cdpValue = this.parseMoney(item.valorCDP);

        const contractNum = item.numContrato;
        const contractObj = item.objetoContrato;
        const contractValue = this.parseMoney(item.valorTotal);
        const contractStartDate = this.parseSapDate(item.fechaInicio);
        const contractEndDate = this.parseSapDate(item.fechaFinal);
        const contractState = item.estado;

        // Mantener posición como string para preservar ceros a la izquierda
        const posNum = item.posicion?.toString() || '';
        const posValue = this.parseMoney(item.valorPosicion);

        // ==========================================
        // 1. MAESTROS (Get or Create)
        // ==========================================

        // Dependencia
        let dependency = await runner.manager.findOne(Dependency, { where: { code: depCode } });
        if (!dependency && depCode) {
            dependency = runner.manager.create(Dependency, { code: depCode, name: depName || 'Sin nombre' });
            await runner.manager.save(dependency);
            this.logger.debug(`Creada Dependencia: ${depCode}`);
        }

        // Contratista
        let contractor = await runner.manager.findOne(Contractor, { where: { nit: contNit } });
        if (!contractor && contNit) {
            contractor = runner.manager.create(Contractor, {
                nit: contNit,
                name: contName || 'Sin nombre',
                email: contEmail,
                address: contAddress,
                phone: contPhone,
            });
            await runner.manager.save(contractor);
            this.logger.debug(`Creado Contratista: ${contNit}`);
        }

        // Fuente de Financiación
        let fund = await runner.manager.findOne(FundingSource, { where: { code: fundCode } });
        if (!fund && fundCode) {
            fund = runner.manager.create(FundingSource, { code: fundCode, name: fundName });
            await runner.manager.save(fund);
            this.logger.debug(`Creada FundingSource: ${fundCode}`);
        }

        // Rubro
        let rubric = await runner.manager.findOne(Rubric, { where: { code: rubricCode } });
        if (!rubric && rubricCode) {
            rubric = runner.manager.create(Rubric, {
                code: rubricCode,
                level: 4,
                type: 'Inversión',
                description: 'Cargado desde SAP',
            });
            await runner.manager.save(rubric);
            this.logger.debug(`Creado Rubric: ${rubricCode}`);
        }

        // ==========================================
        // 2. PLANEACIÓN (Proyecto)
        // ==========================================
        let project = await runner.manager.findOne(Project, { where: { code: projCode } });
        if (!project && projCode) {
            project = runner.manager.create(Project, {
                code: projCode,
                name: projName,
                origin: 'SAP',
                state: true,
                dependency: dependency ?? undefined,
                initialBudget: 0,
                currentBudget: 0,
            });
            await runner.manager.save(project);
            this.logger.debug(`Creado Project: ${projCode}`);
        }

        // ==========================================
        // 3. PRE-CONTRACTUAL (Estudios y Necesidad)
        // ==========================================
        let prevStudy = await runner.manager.findOne(PreviousStudy, { where: { code: psCode } });
        if (!prevStudy && psCode) {
            prevStudy = runner.manager.create(PreviousStudy, {
                code: psCode,
                status: 'Aprobado',
            });
            await runner.manager.save(prevStudy);
            this.logger.debug(`Creado PreviousStudy: ${psCode}`);
        }

        let need = await runner.manager.findOne(Need, { where: { code: needCode } });
        if (!need && needCode) {
            need = runner.manager.create(Need, {
                code: needCode,
                amount: needValue,
                description: 'Cargada desde SAP',
                previousStudy: prevStudy ?? undefined,
            });
            await runner.manager.save(need);
            this.logger.debug(`Creada Need: ${needCode}`);
        }

        // ==========================================
        // 4. CDP (La Reserva)
        // ==========================================
        let cdp = await runner.manager.findOne(Cdp, { where: { number: cdpNum } });
        if (!cdp && cdpNum) {
            cdp = runner.manager.create(Cdp, {
                number: cdpNum,
                totalValue: cdpValue,
                balance: 0,
                dateIssue: new Date(),
            });
            await runner.manager.save(cdp);
            this.logger.debug(`Creado CDP: ${cdpNum}`);

            // Relación CDP - Proyecto
            if (project) {
                const cdpProject = runner.manager.create(CdpProject, {
                    cdpId: cdp.id,
                    projectId: project.id,
                    allocatedValue: cdpValue,
                });
                await runner.manager.save(cdpProject);
                this.logger.debug(`Creada relación CdpProject: CDP ${cdpNum} - Proyecto ${projCode}`);
            }
        }

        // Posición del CDP
        let cdpPos: CdpPosition | null = null;
        if (cdp && posNum) {
            cdpPos = await runner.manager.findOne(CdpPosition, {
                where: { cdpId: cdp.id, positionNumber: posNum },
            });

            if (!cdpPos) {
                cdpPos = runner.manager.create(CdpPosition, {
                    cdpId: cdp.id,
                    positionNumber: posNum,
                    rubricId: rubric?.id,
                    value: posValue,
                    balance: 0,
                    observations: `Posición SAP ${posNum}`,
                });
                await runner.manager.save(cdpPos);
                this.logger.debug(`Creada CdpPosition: CDP ${cdpNum} - Pos ${posNum}`);
            }
        }

        // ==========================================
        // 5. CONTRATO
        // ==========================================
        let contract = await runner.manager.findOne(MasterContract, { where: { number: contractNum } });
        if (!contract && contractNum) {
            contract = runner.manager.create(MasterContract, {
                number: contractNum,
                object: contractObj,
                totalValue: contractValue,
                startDate: contractStartDate,
                endDate: contractEndDate,
                state: contractState || 'Legalizado',
                contractor: contractor ?? undefined,
                need: need ?? undefined,
            });
            await runner.manager.save(contract);
            this.logger.debug(`Creado MasterContract: ${contractNum}`);

            // Relación Contrato - CDP
            if (cdp) {
                const existingRelation = await runner.manager.findOne(ContractCdpRelation, {
                    where: { masterContract: { id: contract.id }, cdp: { id: cdp.id } },
                });

                if (!existingRelation) {
                    const contractCdp = runner.manager.create(ContractCdpRelation, {
                        masterContract: contract,
                        cdp: cdp,
                    });
                    await runner.manager.save(contractCdp);
                    this.logger.debug(`Creada relación ContractCdpRelation: Contrato ${contractNum} - CDP ${cdpNum}`);
                }
            }
        }

        // ==========================================
        // 6. POSICIÓN DEL CONTRATO
        // ==========================================
        if (contract && posNum) {
            let contractPos = await runner.manager.findOne(ContractPosition, {
                where: { contractId: contract.id, positionNumber: posNum },
            });

            if (!contractPos) {
                contractPos = runner.manager.create(ContractPosition, {
                    contractId: contract.id,
                    positionNumber: posNum,
                    value: posValue,
                    allocatedValue: posValue,
                    description: `Carga SAP Pos ${posNum}`,
                    cdpPositionId: cdpPos?.id,
                    rubricId: rubric?.id,
                    fundingSourceId: fund?.id,
                    projectId: project?.id,
                    // Campos huérfanos - se asignan manualmente después
                    cdpFundingId: undefined,
                    detailedActivityId: undefined,
                });
                await runner.manager.save(contractPos);
                this.logger.debug(`Creada ContractPosition: Contrato ${contractNum} - Pos ${posNum}`);
            }
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private parseMoney(value: string): number {
        if (!value) return 0;
        // SAP envía formato: "965000000.00 " => quitar espacios y parsear
        const cleaned = value.trim().replace(/\s/g, '');
        return parseFloat(cleaned) || 0;
    }

    private parseSapDate(dateStr: string): Date | undefined {
        // SAP envía formato YYYYMMDD (20250730)
        if (!dateStr || dateStr.length !== 8) return undefined;
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }
}
