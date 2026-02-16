import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Need } from "../../needs/entities/need.entity";
import { Cdp } from "../../cdps/entities/cdp.entity";
import { CdpPosition } from "../../cdps/entities/cdp-position.entity";
import { CdpPositionFunding } from "../../cdps/entities/cdp-position-funding.entity";
import { CdpProject } from "../../cdps/entities/cdp-project.entity";
import { MasterContract } from "../../master-contracts/entities/master-contract.entity";
import { ContractCdpRelation } from "../../contract-cdp-relations/entities/contract-cdp-relation.entity";
import { BudgetRecord } from "../../budget-records/entities/budget-record.entity";
import { Project } from "../../projects/entities/project.entity";
import { DetailedActivity } from "../../../masters/detailed-activities/entities/detailed-activity.entity";
import { MgaActivity } from "../../../masters/mga-activities/entities/mga-activity.entity";
import { MgaDetailedRelation } from "../../../masters/mga-activities/entities/mga-detailed-relation.entity";
import { BudgetModification, ModificationType } from "../../../masters/budget-modifications/entities/budget-modification.entity";

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Need) private readonly needRepo: Repository<Need>,
        @InjectRepository(Cdp) private readonly cdpRepo: Repository<Cdp>,
        @InjectRepository(CdpPosition) private readonly cdpPositionRepo: Repository<CdpPosition>,
        @InjectRepository(CdpPositionFunding) private readonly cdpFundingRepo: Repository<CdpPositionFunding>,
        @InjectRepository(CdpProject) private readonly cdpProjectRepo: Repository<CdpProject>,
        @InjectRepository(MasterContract) private readonly masterContractRepo: Repository<MasterContract>,
        @InjectRepository(ContractCdpRelation) private readonly contractCdpRepo: Repository<ContractCdpRelation>,
        @InjectRepository(BudgetRecord) private readonly budgetRecordRepo: Repository<BudgetRecord>,
        @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
        @InjectRepository(DetailedActivity) private readonly detailedActivityRepo: Repository<DetailedActivity>,
        @InjectRepository(MgaActivity) private readonly mgaActivityRepo: Repository<MgaActivity>,
        @InjectRepository(MgaDetailedRelation) private readonly mgaDetailedRelRepo: Repository<MgaDetailedRelation>,
        @InjectRepository(BudgetModification) private readonly budgetModRepo: Repository<BudgetModification>,
    ) {}

    // ─── 1. GLOBAL DATA (KPIs) ───────────────────────────────
    async getGlobalData(year?: number, month?: number) {
        // Total budget metrics from projects
        const projectsQuery = this.projectRepo
            .createQueryBuilder("p")
            .select("COALESCE(SUM(p.initial_budget), 0)", "totalInitialBudget")
            .addSelect("COALESCE(SUM(p.current_budget), 0)", "totalCurrentBudget")
            .addSelect("COALESCE(SUM(p.execution), 0)", "totalExecution")
            .addSelect("COUNT(p.id)", "totalProjects");

        const projectMetrics = await projectsQuery.getRawOne();

        // Budget modifications aggregations
        const modsQuery = this.budgetModRepo.createQueryBuilder("bm");

        if (year) {
            modsQuery.where("EXTRACT(YEAR FROM bm.date_issue) = :year", { year });
            if (month) {
                modsQuery.andWhere("EXTRACT(MONTH FROM bm.date_issue) = :month", { month });
            }
        }

        const additionsResult = await modsQuery
            .clone()
            .andWhere("bm.modification_type = :type", { type: ModificationType.ADDITION })
            .select("COALESCE(SUM(bm.value), 0)", "total")
            .getRawOne();

        const reductionsResult = await modsQuery
            .clone()
            .andWhere("bm.modification_type = :type", { type: ModificationType.REDUCTION })
            .select("COALESCE(SUM(bm.value), 0)", "total")
            .getRawOne();

        const transfersResult = await modsQuery
            .clone()
            .andWhere("bm.modification_type = :type", { type: ModificationType.TRANSFER })
            .select("COUNT(bm.id)", "total")
            .getRawOne();

        // Needs and CDPs count
        const needsCount = await this.needRepo.count();
        const cdpsCount = await this.cdpRepo.count();
        const contractsCount = await this.masterContractRepo.count();

        return {
            totalInitialBudget: Number(projectMetrics.totalInitialBudget),
            totalCurrentBudget: Number(projectMetrics.totalCurrentBudget),
            totalExecution: Number(projectMetrics.totalExecution),
            totalProjects: Number(projectMetrics.totalProjects),
            totalAdditions: Number(additionsResult.total),
            totalReductions: Number(reductionsResult.total),
            totalTransfers: Number(transfersResult.total),
            totalNeeds: needsCount,
            totalCdps: cdpsCount,
            totalContracts: contractsCount,
        };
    }

    // ─── 2. NEEDS WITH CDPs DISTRIBUTION ──────────────────────
    async getNeedsWithCdps(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = ["code", "amount", "description", "previousStudy.code", "previousStudy.status", "createAt"];
        const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

        const qb = this.needRepo
            .createQueryBuilder("need")
            .leftJoinAndSelect("need.previousStudy", "previousStudy");

        if (search) {
            qb.where(
                new Brackets((sub) => {
                    sub.where("need.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("need.description ILIKE :search", { search: `%${search}%` })
                        .orWhere("previousStudy.code ILIKE :search", { search: `%${search}%` });
                }),
            );
        }

        if (validSortBy.includes(".")) {
            const [relation, field] = validSortBy.split(".");
            qb.orderBy(`${relation}.${field}`, validSortOrder);
        } else {
            qb.orderBy(`need.${validSortBy}`, validSortOrder);
        }

        qb.skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
        };
    }

    // ─── 3. CDPs BY NEED (pie chart data) ─────────────────────
    async getCdpsByNeedId(needId: string) {
        const results = await this.masterContractRepo
            .createQueryBuilder("mc")
            .innerJoin("contract_cdp_relations", "ccr", "mc.id = ccr.contract_id")
            .innerJoin("cdps", "c", "ccr.cdp_id = c.id")
            .where("mc.need_id = :needId", { needId })
            .select([
                "c.id AS \"id\"",
                "c.number AS \"number\"",
                "c.total_value AS \"totalValue\"",
                "c.balance AS \"balance\"",
            ])
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            number: r.number,
            totalValue: Number(r.totalValue),
            balance: Number(r.balance),
        }));
    }

    // ─── 4. ACTIVITIES BALANCE BY CDP ──────────────────────────
    async getActivitiesByCdp(cdpId: string) {
        const results = await this.cdpFundingRepo
            .createQueryBuilder("cpf")
            .innerJoin("cpf.cdpPosition", "pos")
            .innerJoin("cpf.detailedActivity", "da")
            .innerJoin("da.project", "p")
            .where("pos.cdp_id = :cdpId", { cdpId })
            .select([
                "da.id AS \"id\"",
                "da.code AS \"code\"",
                "da.name AS \"name\"",
                "p.code AS \"projectCode\"",
                "da.cpc AS \"cpc\"",
                "da.budget_ceiling AS \"budgetCeiling\"",
                "cpf.assigned_value AS \"assignedValue\"",
                "cpf.balance AS \"fundingBalance\"",
            ])
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            projectCode: r.projectCode,
            cpc: r.cpc ? Number(r.cpc) : null,
            budgetCeiling: Number(r.budgetCeiling),
            assignedValue: Number(r.assignedValue),
            fundingBalance: Number(r.fundingBalance),
            percentage:
                Number(r.budgetCeiling) === 0
                    ? 0
                    : Math.round((Number(r.assignedValue) / Number(r.budgetCeiling)) * 10000) / 100,
        }));
    }

    // ─── 5. MASTER CONTRACTS BY CDP ───────────────────────────
    async getMasterContractsByCdp(cdpId: string) {
        const results = await this.contractCdpRepo
            .createQueryBuilder("ccr")
            .innerJoinAndSelect("ccr.masterContract", "mc")
            .leftJoinAndSelect("mc.need", "need")
            .where("ccr.cdp_id = :cdpId", { cdpId })
            .getMany();

        return results.map((r) => ({
            id: r.masterContract.id,
            number: r.masterContract.number,
            object: r.masterContract.object,
            totalValue: Number(r.masterContract.totalValue),
            startDate: r.masterContract.startDate,
            endDate: r.masterContract.endDate,
            state: r.masterContract.state,
            needCode: r.masterContract.need?.code ?? null,
        }));
    }

    // ─── 6. CDPs BY MASTER CONTRACT (pie chart) ───────────────
    async getCdpsByMasterContract(contractId: string) {
        const results = await this.contractCdpRepo
            .createQueryBuilder("ccr")
            .innerJoin("ccr.cdp", "c")
            .where("ccr.contract_id = :contractId", { contractId })
            .select([
                "c.id AS \"id\"",
                "c.number AS \"number\"",
                "c.total_value AS \"totalValue\"",
                "c.balance AS \"balance\"",
            ])
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            number: r.number,
            totalValue: Number(r.totalValue),
            balance: Number(r.balance),
        }));
    }

    // ─── 7. BUDGET RECORDS BY MASTER CONTRACT ─────────────────
    async getBudgetRecordsByContract(contractId: string) {
        const results = await this.budgetRecordRepo.find({
            where: { contractId },
            order: { createAt: "DESC" },
        });

        return results.map((r) => ({
            id: r.id,
            number: r.number,
            totalValue: Number(r.totalValue),
            balance: Number(r.balance),
            percentage:
                Number(r.totalValue) === 0
                    ? 0
                    : Math.round(((Number(r.totalValue) - Number(r.balance)) / Number(r.totalValue)) * 10000) / 100,
        }));
    }

    // ─── 8. PROJECT BUDGET OVERVIEW (bar chart) ───────────────
    async getProjectBudgetOverview() {
        const results = await this.projectRepo
            .createQueryBuilder("p")
            .leftJoin("p.dependency", "d")
            .select([
                "p.id AS \"id\"",
                "p.code AS \"code\"",
                "p.name AS \"name\"",
                "p.initial_budget AS \"initialBudget\"",
                "p.current_budget AS \"currentBudget\"",
                "p.execution AS \"execution\"",
                "d.name AS \"dependencyName\"",
            ])
            .where("p.state = :state", { state: true })
            .orderBy("p.code", "ASC")
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            initialBudget: Number(r.initialBudget),
            currentBudget: Number(r.currentBudget),
            execution: Number(r.execution),
            dependencyName: r.dependencyName,
            available: Number(r.currentBudget) - Number(r.execution),
            executionPercentage:
                Number(r.currentBudget) === 0
                    ? 0
                    : Math.round((Number(r.execution) / Number(r.currentBudget)) * 10000) / 100,
        }));
    }

    // ─── 9. PROJECT EXECUTION OVERVIEW ────────────────────────
    async getProjectExecutionOverview(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ) {
        const skip = (page - 1) * limit;
        const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortMap: Record<string, string> = {
            code: "p.code",
            name: "p.name",
            initialBudget: "p.initial_budget",
            currentBudget: "p.current_budget",
            execution: "p.execution",
            dependencyName: "d.name",
        };
        const sortField = sortBy && sortMap[sortBy] ? sortMap[sortBy] : "p.code";

        const qb = this.projectRepo
            .createQueryBuilder("p")
            .leftJoin("p.dependency", "d")
            .select([
                "p.id AS \"id\"",
                "p.code AS \"code\"",
                "p.name AS \"name\"",
                "p.initial_budget AS \"initialBudget\"",
                "p.current_budget AS \"currentBudget\"",
                "p.execution AS \"execution\"",
                "d.name AS \"dependencyName\"",
            ])
            .addSelect(
                `(SELECT COUNT(*) FROM mga_activities ma WHERE ma.project_id = p.id)`,
                "mgaCount",
            );

        if (search) {
            qb.where(
                new Brackets((sub) => {
                    sub.where("p.code ILIKE :search", { search: `%${search}%` })
                        .orWhere("p.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("d.name ILIKE :search", { search: `%${search}%` });
                }),
            );
        }

        const total = await qb.getCount();

        const data = await qb
            .orderBy(sortField, validSortOrder)
            .offset(skip)
            .limit(limit)
            .getRawMany();

        const totalPages = Math.ceil(total / limit);

        return {
            data: data.map((r) => ({
                id: r.id,
                code: r.code,
                name: r.name,
                initialBudget: Number(r.initialBudget),
                currentBudget: Number(r.currentBudget),
                execution: Number(r.execution),
                dependencyName: r.dependencyName,
                executionPercentage:
                    Number(r.currentBudget) === 0
                        ? 0
                        : Math.round((Number(r.execution) / Number(r.currentBudget)) * 10000) / 100,
                mgaActivitiesCount: Number(r.mgaCount),
            })),
            meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
        };
    }

    // ─── 10. MGA ACTIVITIES BY PROJECT ────────────────────────
    async getMgaActivitiesByProject(projectId: string) {
        const results = await this.mgaActivityRepo
            .createQueryBuilder("mga")
            .leftJoin("mga.detailedRelations", "rel")
            .leftJoin("rel.detailedActivity", "da")
            .where("mga.project_id = :projectId", { projectId })
            .select([
                "mga.id AS \"id\"",
                "mga.code AS \"code\"",
                "mga.name AS \"name\"",
                "mga.activity_date AS \"activityDate\"",
                "COALESCE(SUM(da.budget_ceiling), 0) AS \"totalValue\"",
                "COALESCE(SUM(da.balance), 0) AS \"totalBalance\"",
                "COUNT(DISTINCT da.id) AS \"detailedCount\"",
            ])
            .groupBy("mga.id")
            .addGroupBy("mga.code")
            .addGroupBy("mga.name")
            .addGroupBy("mga.activity_date")
            .orderBy("mga.code", "ASC")
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            activityDate: r.activityDate,
            totalValue: Number(r.totalValue),
            totalBalance: Number(r.totalBalance),
            executedValue: Number(r.totalValue) - Number(r.totalBalance),
            executionPercentage:
                Number(r.totalValue) === 0
                    ? 0
                    : Math.round(((Number(r.totalValue) - Number(r.totalBalance)) / Number(r.totalValue)) * 10000) / 100,
            detailedActivitiesCount: Number(r.detailedCount),
        }));
    }

    // ─── 11. DETAILED ACTIVITIES BY MGA ───────────────────────
    async getDetailedActivitiesByMga(mgaActivityId: string) {
        const results = await this.mgaDetailedRelRepo
            .createQueryBuilder("rel")
            .innerJoin("rel.detailedActivity", "da")
            .innerJoin("da.project", "p")
            .where("rel.mga_activity_id = :mgaActivityId", { mgaActivityId })
            .select([
                "da.id AS \"id\"",
                "da.code AS \"code\"",
                "da.name AS \"name\"",
                "da.budget_ceiling AS \"budgetCeiling\"",
                "da.balance AS \"balance\"",
                "p.code AS \"projectCode\"",
                `(SELECT COUNT(*) FROM cdp_position_funding cpf WHERE cpf.detailed_activity_id = da.id) AS "cdpCount"`,

            ])
            .getRawMany();

        return results.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            budgetCeiling: Number(r.budgetCeiling),
            balance: Number(r.balance),
            executedValue: Number(r.budgetCeiling) - Number(r.balance),
            executionPercentage:
                Number(r.budgetCeiling) === 0
                    ? 0
                    : Math.round(((Number(r.budgetCeiling) - Number(r.balance)) / Number(r.budgetCeiling)) * 10000) / 100,
            projectCode: r.projectCode,
            cdpCount: Number(r.cdpCount),
        }));
    }

    // ─── 12. BUDGET MODIFICATIONS BY ACTIVITY ─────────────────
    async getBudgetModificationsByActivity(detailedActivityId: string) {
        const results = await this.budgetModRepo.find({
            where: { detailedActivityId },
            order: { dateIssue: "DESC" },
        });

        const additions = results.filter((r) => r.modificationType === ModificationType.ADDITION);
        const reductions = results.filter((r) => r.modificationType === ModificationType.REDUCTION);
        const transfers = results.filter((r) => r.modificationType === ModificationType.TRANSFER);

        const totalAdditions = additions.reduce((sum, r) => sum + Number(r.value), 0);
        const totalReductions = reductions.reduce((sum, r) => sum + Number(r.value), 0);

        return {
            additions: additions.map((r) => ({
                id: r.id,
                value: Number(r.value),
                dateIssue: r.dateIssue,
                legalDocument: r.legalDocument,
                description: r.description,
                previousBalance: Number(r.previousBalance),
                newBalance: Number(r.newBalance),
            })),
            reductions: reductions.map((r) => ({
                id: r.id,
                value: Number(r.value),
                dateIssue: r.dateIssue,
                legalDocument: r.legalDocument,
                description: r.description,
                previousBalance: Number(r.previousBalance),
                newBalance: Number(r.newBalance),
            })),
            transfers: transfers.map((r) => ({
                id: r.id,
                value: Number(r.value),
                dateIssue: r.dateIssue,
                legalDocument: r.legalDocument,
                description: r.description,
                previousBalance: Number(r.previousBalance),
                newBalance: Number(r.newBalance),
            })),
            totalAdditions,
            totalReductions,
            totalTransfers: transfers.length,
        };
    }
}
