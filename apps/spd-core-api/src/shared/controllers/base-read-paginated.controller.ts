import { Get, Param, Query } from "@nestjs/common";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

/**
 * Interface that services must implement to be used with
 * the findAllPaginated pattern in BaseReadPaginatedController.
 */
export interface IPaginatedReadService {
    findAllPaginated(
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ): Promise<any>;
    findOne(id: string): Promise<any>;
}

/**
 * Interface for services that support a "select" endpoint (autocomplete/dropdown).
 */
export interface ISelectableService {
    findForSelect(
        search?: string,
        limit?: number,
        offset?: number,
    ): Promise<any>;
}

/**
 * Abstract base controller for read-only paginated financial controllers.
 * Provides standard findAll(paginated) + findOne endpoints.
 *
 * Subclasses MUST apply @Controller() and @UseGuards() decorators.
 */
export abstract class BaseReadPaginatedController {
    protected abstract readonly service: IPaginatedReadService;
    protected abstract readonly entityLabel: string;

    @Get()
    @ResponseMessage("Listado obtenido exitosamente")
    findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.service.findAllPaginated(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    @Get(":id")
    @ResponseMessage("Detalle obtenido exitosamente")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }
}

/**
 * Extends BaseReadPaginatedController with a "select" endpoint
 * for autocomplete/dropdown scenarios.
 */
export abstract class BaseReadPaginatedSelectController extends BaseReadPaginatedController {
    protected abstract readonly service: IPaginatedReadService & ISelectableService;

    @Get("select")
    @ResponseMessage("Datos para selector")
    findForSelect(
        @Query("search") search: string,
        @Query("limit") limit: number,
        @Query("offset") offset: number,
    ) {
        return this.service.findForSelect(
            search,
            limit ? +limit : 30,
            offset ? +offset : 0,
        );
    }
}
