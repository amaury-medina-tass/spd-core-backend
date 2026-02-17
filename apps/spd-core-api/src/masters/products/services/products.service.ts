import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Product } from "../entities/product.entity";
import { buildPaginatedMeta, executeFindForSelect, calculateSkip, validateSortParams } from "../../../shared/helpers";

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ) {
        const skip = calculateSkip(page, limit);
        const sortableFields = ["createAt", "updateAt", "productCode", "productName", "indicatorCode", "indicatorName", "measuredUnit", "unitType", "isMainIndicator"];
        const { validSortBy, validSortOrder } = validateSortParams(sortBy, sortOrder, sortableFields);

        const queryBuilder = this.productRepository.createQueryBuilder("product");

        if (search) {
            queryBuilder.where(new Brackets((qb) => {
                qb.where("product.productCode ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.productName ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.indicatorCode ILIKE :search", { search: `%${search}%` })
                    .orWhere("product.indicatorName ILIKE :search", { search: `%${search}%` });
            }));
        }

        queryBuilder.orderBy(`product.${validSortBy}`, validSortOrder);
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return { data, meta: buildPaginatedMeta(total, page, limit) };
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.productRepository
            .createQueryBuilder("product")
            .select([
                "product.id",
                "product.productCode",
                "product.indicatorName"
            ]);

        return executeFindForSelect({
            queryBuilder,
            applySearch: (qb, s) => {
                qb.where(
                    new Brackets((b) => {
                        b.where("product.productCode ILIKE :search", { search: `%${s}%` })
                            .orWhere("product.productName ILIKE :search", { search: `%${s}%` })
                            .orWhere("product.indicatorCode ILIKE :search", { search: `%${s}%` })
                            .orWhere("product.indicatorName ILIKE :search", { search: `%${s}%` });
                    })
                );
            },
            orderBy: [["product.productName", "ASC"], ["product.indicatorName", "ASC"]],
            search,
            limit,
            offset,
        });
    }

    async findOne(id: string) {
        return this.productRepository.findOneBy({ id });
    }
}
