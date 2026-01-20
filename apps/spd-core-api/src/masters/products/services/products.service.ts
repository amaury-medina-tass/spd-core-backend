import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Product } from "../entities/product.entity";

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
        const skip = (page - 1) * limit;

        const validSortOrder =
            sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

        const sortableFields = [
            "createAt",
            "updateAt",
            "productCode",
            "productName",
            "indicatorCode",
            "indicatorName",
            "measuredUnit",
            "unitType",
            "isMainIndicator"
        ];
        const validSortBy =
            sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";

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

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findForSelect(search?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.productRepository
            .createQueryBuilder("product")
            .select([
                "product.id",
                "product.productCode",
                "product.indicatorName"
            ]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("product.productCode ILIKE :search", { search: `%${search}%` })
                        .orWhere("product.productName ILIKE :search", { search: `%${search}%` })
                        .orWhere("product.indicatorCode ILIKE :search", { search: `%${search}%` })
                        .orWhere("product.indicatorName ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        const [data, total] = await queryBuilder
            .orderBy("product.productName", "ASC")
            .addOrderBy("product.indicatorName", "ASC")
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + data.length < total,
            },
        };
    }

    async findOne(id: string) {
        return this.productRepository.findOneBy({ id });
    }
}
