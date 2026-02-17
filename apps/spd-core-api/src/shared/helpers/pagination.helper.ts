/**
 * Shared pagination helpers to reduce code duplication across services.
 */

export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface SelectMeta {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginatedMeta;
}

export interface SelectResult<T> {
    data: T[];
    meta: SelectMeta;
}

/**
 * Builds paginated metadata from total count, page and limit.
 */
export function buildPaginatedMeta(total: number, page: number, limit: number): PaginatedMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

/**
 * Builds select (offset-based) metadata.
 */
export function buildSelectMeta(total: number, limit: number, offset: number, dataLength: number): SelectMeta {
    return {
        total,
        limit,
        offset,
        hasMore: offset + dataLength < total,
    };
}

/**
 * Returns an empty paginated response.
 */
export function emptyPaginatedResponse<T = any>(page: number, limit: number): PaginatedResult<T> {
    return {
        data: [],
        meta: buildPaginatedMeta(0, page, limit),
    };
}

/**
 * Validates and returns sort parameters.
 */
export function validateSortParams(
    sortBy: string | undefined,
    sortOrder: "ASC" | "DESC" | undefined,
    sortableFields: string[],
    defaultSortBy: string = "createAt",
    defaultSortOrder: "ASC" | "DESC" = "DESC",
): { validSortBy: string; validSortOrder: "ASC" | "DESC" } {
    const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : defaultSortOrder;
    const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : defaultSortBy;
    return { validSortBy, validSortOrder };
}

/**
 * Applies order by to a query builder, supporting dot-notation for relations.
 */
export function applyOrderBy<T>(
    queryBuilder: import("typeorm").SelectQueryBuilder<T>,
    alias: string,
    sortBy: string,
    sortOrder: "ASC" | "DESC",
): void {
    if (sortBy.includes(".")) {
        const [relation, field] = sortBy.split(".");
        queryBuilder.orderBy(`${relation}.${field}`, sortOrder);
    } else {
        queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
    }
}

/**
 * Calculates skip value from page and limit.
 */
export function calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Configuration for `findPaginatedRelations()`.
 * Extracts the common "associated / available / all" pattern used in
 * variable-indicator and project-indicator relation services.
 */
export interface FindPaginatedRelationsConfig<TTarget> {
    /** IDs of already-associated target entities */
    associatedIds: string[];
    /** QueryBuilder for the target entity, pre-configured with alias */
    queryBuilder: import("typeorm").SelectQueryBuilder<TTarget>;
    /** The alias used in the queryBuilder (e.g. "variable", "project") */
    alias: string;
    /** Callback to apply ILIKE search brackets */
    applySearch: (qb: import("typeorm").SelectQueryBuilder<TTarget>, search: string) => void;
    /** "associated" | "available" | "all" */
    type: "associated" | "available" | "all";
    page: number;
    limit: number;
    search?: string;
    /** Order by expression, defaults to `${alias}.code ASC` */
    orderBy?: [string, "ASC" | "DESC"];
}

/**
 * Executes a paginated relation query for associated/available/all patterns.
 * Returns `{ data, meta }` with `isAssociated` flag when type === "all".
 */
export async function findPaginatedRelations<TTarget extends { id: string }>(
    config: FindPaginatedRelationsConfig<TTarget>,
): Promise<PaginatedResult<TTarget & { isAssociated?: boolean }>> {
    const { associatedIds, queryBuilder, alias, applySearch, type, page, limit, search, orderBy } = config;
    const skip = calculateSkip(page, limit);

    if (type === "associated") {
        if (associatedIds.length === 0) {
            return emptyPaginatedResponse(page, limit);
        }
        queryBuilder.where(`${alias}.id IN (:...ids)`, { ids: associatedIds });
    } else if (type === "available") {
        if (associatedIds.length > 0) {
            queryBuilder.where(`${alias}.id NOT IN (:...ids)`, { ids: associatedIds });
        }
    }

    if (search) {
        applySearch(queryBuilder, search);
    }

    const [orderExpr, orderDir] = orderBy ?? [`${alias}.code`, "ASC"];
    const [data, total] = await queryBuilder
        .orderBy(orderExpr, orderDir)
        .skip(skip)
        .take(limit)
        .getManyAndCount();

    const enrichedData = type === "all"
        ? data.map(item => ({ ...item, isAssociated: associatedIds.includes(item.id) }))
        : data;

    return { data: enrichedData, meta: buildPaginatedMeta(total, page, limit) };
}

/**
 * Configuration for a generic "find for select" query (dropdown/autocomplete).
 */
export interface FindForSelectConfig<T> {
    /** TypeORM query builder, pre-configured with alias and selections */
    queryBuilder: import("typeorm").SelectQueryBuilder<T>;
    /** Optional search callback — apply ILIKE / Brackets here */
    applySearch?: (qb: import("typeorm").SelectQueryBuilder<T>, search: string) => void;
    /** Order expressions, e.g. [["alias.name", "ASC"]] */
    orderBy: Array<[string, "ASC" | "DESC"]>;
    search?: string;
    limit: number;
    offset: number;
}

/**
 * Configuration for findAllPaginatedByParent helper.
 * Extracts the common "filter by parent + search + sort + paginate" pattern
 * used in goals, quadrenniums, and similar child-entity services.
 */
export interface FindAllPaginatedByParentConfig<T> {
    /** TypeORM query builder, pre-configured with alias, joins, and parent .where() */
    queryBuilder: import("typeorm").SelectQueryBuilder<T>;
    /** The alias of the child entity in the query builder */
    alias: string;
    /** Callback to apply ILIKE search brackets */
    applySearch: (qb: import("typeorm").SelectQueryBuilder<T>, search: string) => void;
    /** List of allowed sortable fields */
    sortableFields: string[];
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    /** Default field to sort by (defaults to "createAt") */
    defaultSortBy?: string;
}

/**
 * Executes a paginated query filtered by a parent entity.
 * Centralises the repeated pattern used across goals, quadrenniums, and similar services.
 */
export async function findAllPaginatedByParent<T>(
    config: FindAllPaginatedByParentConfig<T>,
): Promise<PaginatedResult<T>> {
    const { queryBuilder, alias, applySearch, sortableFields, page, limit, search, sortBy, sortOrder, defaultSortBy } = config;
    const skip = calculateSkip(page, limit);
    const { validSortBy, validSortOrder } = validateSortParams(sortBy, sortOrder, sortableFields, defaultSortBy);

    if (search) {
        applySearch(queryBuilder, search);
    }

    applyOrderBy(queryBuilder, alias, validSortBy, validSortOrder);
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, meta: buildPaginatedMeta(total, page, limit) };
}

/**
 * Executes a generic findForSelect query and returns { data, meta }.
 * Centralises the repeated pattern used across ~9 service files.
 */
export async function executeFindForSelect<T>(config: FindForSelectConfig<T>): Promise<SelectResult<T>> {
    const { queryBuilder, applySearch, orderBy, search, limit, offset } = config;

    if (search && applySearch) {
        applySearch(queryBuilder, search);
    }

    orderBy.forEach(([expression, direction], index) => {
        if (index === 0) {
            queryBuilder.orderBy(expression, direction);
        } else {
            queryBuilder.addOrderBy(expression, direction);
        }
    });

    const [data, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

    return {
        data,
        meta: buildSelectMeta(total, limit, offset, data.length),
    };
}
