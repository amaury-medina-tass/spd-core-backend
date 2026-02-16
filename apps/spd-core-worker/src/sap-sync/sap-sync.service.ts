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
import { BudgetRecord } from '../../../spd-core-api/src/financial/budget-records/entities/budget-record.entity';

interface ContractData {
    number: string;
    object: string;
    value: number;
    startDate?: Date;
    endDate?: Date;
    state: string;
}

interface ContractRelations {
    contractor: Contractor | null;
    need: Need | null;
    cdp: Cdp | null;
    cdpNum: string;
}

interface PositionData {
    contract: MasterContract | null;
    contractNum: string;
    posNum: string;
    posValue: number;
}

interface PositionRelations {
    cdpPos: CdpPosition | null;
    rubric: Rubric | null;
    fund: FundingSource | null;
    project: Project | null;
    budgetRecord: BudgetRecord | null;
}

@Injectable()
export class SapSyncService {
    private readonly logger = new Logger(SapSyncService.name);

    constructor(private readonly dataSource: DataSource) { }

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

        const pedidoNum = item.pedido?.toString()?.trim();

        const contractNum = item.numContrato;
        const contractObj = item.objetoContrato;
        const contractValue = this.parseMoney(item.valorTotal);
        const contractStartDate = this.parseSapDate(item.fechaInicio);
        const contractEndDate = this.parseSapDate(item.fechaFinal);
        const contractState = item.estado;

        // Mantener posición como string para preservar ceros a la izquierda
        const posNum = item.posicion?.toString() || '';
        const posValue = this.parseMoney(item.valorPosicion);

        // 1. MAESTROS
        const dependency = await this.findOrCreateDependency(runner, depCode, depName);
        const contractor = await this.findOrCreateContractor(runner, contNit, contName, contEmail, contAddress, contPhone);
        const fund = await this.findOrCreateFundingSource(runner, fundCode, fundName);
        const rubric = await this.findOrCreateRubric(runner, rubricCode);

        // 2. PLANEACIÓN
        const project = await this.findOrCreateProject(runner, projCode, projName, dependency);

        // 3. PRE-CONTRACTUAL
        const prevStudy = await this.findOrCreatePreviousStudy(runner, psCode);
        const need = await this.findOrCreateNeed(runner, needCode, needValue, prevStudy);

        // 4. CDP
        const cdp = await this.findOrCreateCdp(runner, cdpNum, cdpValue);
        await this.syncCdpProjectRelation(runner, cdp, project, cdpNum, projCode, posValue, cdpValue);
        const cdpPos = await this.findOrCreateCdpPosition(runner, cdp, cdpNum, posNum, rubric, posValue);

        // 5. CONTRATO
        const contract = await this.syncMasterContract(
            runner,
            { number: contractNum, object: contractObj, value: contractValue, startDate: contractStartDate, endDate: contractEndDate, state: contractState },
            { contractor, need, cdp, cdpNum }
        );

        // 6. REGISTRO PRESUPUESTAL
        const budgetRecord = await this.syncBudgetRecord(runner, pedidoNum, contractValue, contract, cdp);

        // 7. POSICIÓN DEL CONTRATO
        await this.syncContractPosition(
            runner,
            { contract, contractNum, posNum, posValue },
            { cdpPos, rubric, fund, project, budgetRecord }
        );
    }

    // ==========================================
    // ENTITY SYNC HELPERS
    // ==========================================

    private async findOrCreateDependency(runner: QueryRunner, code: string, name: string): Promise<Dependency | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(Dependency, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(Dependency, { code, name: name || 'Sin nombre' });
        await runner.manager.save(entity);
        this.logger.debug(`Creada Dependencia: ${code}`);
        return entity;
    }

    private async findOrCreateContractor(
        runner: QueryRunner, nit: string, name: string, email: string, address: string, phone: string
    ): Promise<Contractor | null> {
        if (!nit) return null;
        const existing = await runner.manager.findOne(Contractor, { where: { nit } });
        if (existing) return existing;
        const entity = runner.manager.create(Contractor, {
            nit, name: name || 'Sin nombre', email, address, phone,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creado Contratista: ${nit}`);
        return entity;
    }

    private async findOrCreateFundingSource(runner: QueryRunner, code: string, name: string): Promise<FundingSource | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(FundingSource, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(FundingSource, { code, name });
        await runner.manager.save(entity);
        this.logger.debug(`Creada FundingSource: ${code}`);
        return entity;
    }

    private async findOrCreateRubric(runner: QueryRunner, code: string): Promise<Rubric | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(Rubric, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(Rubric, {
            code, level: 4, type: 'Inversión', description: 'Cargado desde SAP',
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creado Rubric: ${code}`);
        return entity;
    }

    private async findOrCreateProject(
        runner: QueryRunner, code: string, name: string, dependency: Dependency | null
    ): Promise<Project | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(Project, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(Project, {
            code, name, origin: 'SAP', state: true,
            dependency: dependency ?? undefined,
            initialBudget: 0, currentBudget: 0,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creado Project: ${code}`);
        return entity;
    }

    private async findOrCreatePreviousStudy(runner: QueryRunner, code: string): Promise<PreviousStudy | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(PreviousStudy, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(PreviousStudy, { code, status: 'Aprobado' });
        await runner.manager.save(entity);
        this.logger.debug(`Creado PreviousStudy: ${code}`);
        return entity;
    }

    private async findOrCreateNeed(
        runner: QueryRunner, code: string, amount: number, prevStudy: PreviousStudy | null
    ): Promise<Need | null> {
        if (!code) return null;
        const existing = await runner.manager.findOne(Need, { where: { code } });
        if (existing) return existing;
        const entity = runner.manager.create(Need, {
            code, amount, description: 'Cargada desde SAP',
            previousStudy: prevStudy ?? undefined,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creada Need: ${code}`);
        return entity;
    }

    private async findOrCreateCdp(runner: QueryRunner, cdpNumber: string, totalValue: number): Promise<Cdp | null> {
        if (!cdpNumber) return null;
        const existing = await runner.manager.findOne(Cdp, { where: { number: cdpNumber } });
        if (existing) return existing;
        const entity = runner.manager.create(Cdp, {
            number: cdpNumber, totalValue, balance: 0, dateIssue: new Date(),
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creado CDP: ${cdpNumber}`);
        return entity;
    }

    private async syncCdpProjectRelation(
        runner: QueryRunner, cdp: Cdp | null, project: Project | null,
        cdpNum: string, projCode: string, posValue: number, cdpValue: number
    ): Promise<void> {
        if (!cdp || !project) return;
        const existing = await runner.manager.findOne(CdpProject, {
            where: { cdpId: cdp.id, projectId: project.id },
        });
        if (existing) {
            existing.allocatedValue = (existing.allocatedValue || 0) + (posValue || 0);
            await runner.manager.save(existing);
            this.logger.debug(`Actualizada relación CdpProject: CDP ${cdpNum} - Proyecto ${projCode} (total: ${existing.allocatedValue})`);
            return;
        }
        const cdpProject = runner.manager.create(CdpProject, {
            cdpId: cdp.id, projectId: project.id,
            allocatedValue: posValue || cdpValue,
        });
        await runner.manager.save(cdpProject);
        this.logger.debug(`Creada relación CdpProject: CDP ${cdpNum} - Proyecto ${projCode} (${posValue || cdpValue})`);
    }

    private async findOrCreateCdpPosition(
        runner: QueryRunner, cdp: Cdp | null, cdpNum: string, posNum: string,
        rubric: Rubric | null, posValue: number
    ): Promise<CdpPosition | null> {
        if (!cdp || !posNum) return null;
        const existing = await runner.manager.findOne(CdpPosition, {
            where: { cdpId: cdp.id, positionNumber: posNum },
        });
        if (existing) return existing;
        const entity = runner.manager.create(CdpPosition, {
            cdpId: cdp.id, positionNumber: posNum, rubricId: rubric?.id,
            value: posValue, balance: 0, observations: `Posición SAP ${posNum}`,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creada CdpPosition: CDP ${cdpNum} - Pos ${posNum}`);
        return entity;
    }

    private async syncMasterContract(
        runner: QueryRunner,
        contractData: ContractData,
        relations: ContractRelations
    ): Promise<MasterContract | null> {
        const existing = await runner.manager.findOne(MasterContract, { where: { number: contractData.number } });
        if (existing) return existing;
        if (!contractData.number) return null;

        const contract = runner.manager.create(MasterContract, {
            number: contractData.number,
            object: contractData.object,
            totalValue: contractData.value,
            startDate: contractData.startDate,
            endDate: contractData.endDate,
            state: contractData.state || 'Legalizado',
            contractor: relations.contractor ?? undefined,
            need: relations.need ?? undefined,
        });
        await runner.manager.save(contract);
        this.logger.debug(`Creado MasterContract: ${contractData.number}`);
        await this.syncContractCdpRelation(runner, contract, relations.cdp, contractData.number, relations.cdpNum);
        return contract;
    }

    private async syncContractCdpRelation(
        runner: QueryRunner, contract: MasterContract, cdp: Cdp | null,
        contractNum: string, cdpNum: string
    ): Promise<void> {
        if (!cdp) return;
        const existing = await runner.manager.findOne(ContractCdpRelation, {
            where: { masterContract: { id: contract.id }, cdp: { id: cdp.id } },
        });
        if (existing) return;
        const contractCdp = runner.manager.create(ContractCdpRelation, {
            masterContract: contract, cdp,
        });
        await runner.manager.save(contractCdp);
        this.logger.debug(`Creada relación ContractCdpRelation: Contrato ${contractNum} - CDP ${cdpNum}`);
    }

    private async syncBudgetRecord(
        runner: QueryRunner, pedidoNum: string, contractValue: number,
        contract: MasterContract | null, cdp: Cdp | null
    ): Promise<BudgetRecord | null> {
        if (!pedidoNum) return null;
        const existing = await runner.manager.findOne(BudgetRecord, { where: { number: pedidoNum } });
        if (existing) {
            existing.contractId = contract?.id;
            existing.cdpId = cdp?.id;
            existing.totalValue = contractValue;
            await runner.manager.save(existing);
            return existing;
        }
        const entity = runner.manager.create(BudgetRecord, {
            number: pedidoNum, totalValue: contractValue, balance: contractValue,
            contractId: contract?.id, cdpId: cdp?.id,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creado BudgetRecord: ${pedidoNum}`);
        return entity;
    }

    private async syncContractPosition(
        runner: QueryRunner,
        positionData: PositionData,
        relations: PositionRelations
    ): Promise<void> {
        if (!positionData.contract || !positionData.posNum) return;
        const existing = await runner.manager.findOne(ContractPosition, {
            where: { contractId: positionData.contract.id, positionNumber: positionData.posNum },
        });
        if (existing) return;
        const entity = runner.manager.create(ContractPosition, {
            contractId: positionData.contract.id,
            positionNumber: positionData.posNum,
            value: positionData.posValue,
            allocatedValue: positionData.posValue,
            description: `Carga SAP Pos ${positionData.posNum}`,
            cdpPositionId: relations.cdpPos?.id,
            rubricId: relations.rubric?.id,
            fundingSourceId: relations.fund?.id,
            projectId: relations.project?.id,
            budgetRecordId: relations.budgetRecord?.id,
            cdpFundingId: undefined,
            detailedActivityId: undefined,
        });
        await runner.manager.save(entity);
        this.logger.debug(`Creada ContractPosition: Contrato ${positionData.contractNum} - Pos ${positionData.posNum}`);
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private parseMoney(value: string): number {
        if (!value) return 0;
        // SAP envía formato: "965000000.00 " => quitar espacios y parsear
        const cleaned = value.trim().replaceAll(/\s/g, '');
        return Number.parseFloat(cleaned) || 0;
    }

    private parseSapDate(dateStr: string): Date | undefined {
        // SAP envía formato YYYYMMDD (20250730)
        if (dateStr?.length !== 8) return undefined;
        const year = Number.parseInt(dateStr.substring(0, 4));
        const month = Number.parseInt(dateStr.substring(4, 6)) - 1;
        const day = Number.parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }
}
