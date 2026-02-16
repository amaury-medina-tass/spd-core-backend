import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../common/decorators/response-message.decorator";
import { DashboardService } from "../services/dashboard.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("financial/dashboard")
export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    // ─── KPIs GLOBALES ────────────────────────────────────────
    @Get("global")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Datos globales del dashboard financiero")
    getGlobalData(
        @Query("year") year?: number,
        @Query("month") month?: number,
    ) {
        return this.service.getGlobalData(
            year ? +year : undefined,
            month ? +month : undefined,
        );
    }

    // ─── NECESIDADES CON CDPs ─────────────────────────────────
    @Get("needs")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Necesidades para el dashboard")
    getNeedsWithCdps(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.service.getNeedsWithCdps(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    // ─── CDPs POR NECESIDAD (pie chart) ───────────────────────
    @Get("needs/:id/cdps")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("CDPs asociados a la necesidad")
    getCdpsByNeed(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getCdpsByNeedId(id);
    }

    // ─── ACTIVIDADES POR CDP ──────────────────────────────────
    @Get("cdps/:id/activities")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Actividades detalladas por CDP")
    getActivitiesByCdp(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getActivitiesByCdp(id);
    }

    // ─── CONTRATOS MARCO POR CDP ──────────────────────────────
    @Get("cdps/:id/contracts")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Contratos marco por CDP")
    getMasterContractsByCdp(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getMasterContractsByCdp(id);
    }

    // ─── CDPs POR CONTRATO MARCO (pie chart) ──────────────────
    @Get("contracts/:id/cdps")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("CDPs asociados al contrato marco")
    getCdpsByMasterContract(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getCdpsByMasterContract(id);
    }

    // ─── REGISTROS PRESUPUESTALES POR CONTRATO ────────────────
    @Get("contracts/:id/budget-records")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Registros presupuestales del contrato marco")
    getBudgetRecordsByContract(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getBudgetRecordsByContract(id);
    }

    // ─── RESUMEN DE PRESUPUESTO POR PROYECTO (bar chart) ──────
    @Get("projects/budget-overview")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Resumen de presupuesto por proyecto")
    getProjectBudgetOverview() {
        return this.service.getProjectBudgetOverview();
    }

    // ─── EJECUCIÓN FINANCIERA DE PROYECTOS ────────────────────
    @Get("projects/execution")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Ejecución financiera de proyectos")
    getProjectExecutionOverview(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.service.getProjectExecutionOverview(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    // ─── ACTIVIDADES MGA POR PROYECTO ─────────────────────────
    @Get("projects/:id/mga-activities")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Actividades MGA del proyecto")
    getMgaActivitiesByProject(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getMgaActivitiesByProject(id);
    }

    // ─── ACTIVIDADES DETALLADAS POR MGA ───────────────────────
    @Get("mga-activities/:id/detailed")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Actividades detalladas de la actividad MGA")
    getDetailedActivitiesByMga(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getDetailedActivitiesByMga(id);
    }

    // ─── AJUSTES PRESUPUESTALES POR ACTIVIDAD ─────────────────
    @Get("activities/:id/modifications")
    @RequirePermission("/financial/dashboard", "READ")
    @ResponseMessage("Ajustes presupuestales de la actividad")
    getBudgetModifications(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.getBudgetModificationsByActivity(id);
    }
}
