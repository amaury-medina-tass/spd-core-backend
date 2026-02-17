import { Body, Delete, Get, Param, Patch, Post, ParseUUIDPipe, Query } from "@nestjs/common";

/**
 * Interface that any indicator-goals service must implement
 * to be used with BaseIndicatorGoalsController.
 */
export interface IIndicatorGoalsControllerService {
    create(createDto: any): Promise<any>;
    findAllPaginated(
        indicatorId: string,
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
    ): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateDto: any): Promise<any>;
    remove(id: string): Promise<any>;
}

/**
 * Abstract base controller for indicator goals CRUD.
 * Shared between action-plan and indicative-plan controllers.
 *
 * Subclasses MUST apply @Controller(), @UseGuards(), and @RequirePermission() decorators,
 * and implement abstract methods to provide properly-typed DTOs.
 */
export abstract class BaseIndicatorGoalsController {
    protected abstract readonly service: IIndicatorGoalsControllerService;
    protected abstract readonly permissionPath: string;

    @Post()
    create(@Body() createDto: any) {
        return this.service.create(createDto);
    }

    @Get()
    findAll(
        @Query("indicatorId", ParseUUIDPipe) indicatorId: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("search") search: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: "ASC" | "DESC",
    ) {
        return this.service.findAllPaginated(
            indicatorId,
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            sortBy,
            sortOrder,
        );
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updateDto: any,
    ) {
        return this.service.update(id, updateDto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
