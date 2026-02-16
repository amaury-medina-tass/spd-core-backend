import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Location } from "../entities/location.entity";
import { Commune } from "../entities/commune.entity";
import { CreateLocationDto } from "../dtos/create-location.dto";

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);

    constructor(
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
        @InjectRepository(Commune)
        private readonly communeRepository: Repository<Commune>,
    ) { }

    /**
     * Normaliza una dirección:
     * - Convierte a mayúsculas
     * - Elimina acentos
     * - Elimina espacios duplicados
     * - Elimina caracteres especiales innecesarios
     */
    private normalizeAddress(address: string): string {
        return address
            .toUpperCase()
            .normalize("NFD")
            .replaceAll(/[\u0300-\u036f]/g, "") // Elimina acentos
            .replaceAll(/[^\w\s#\-.]/g, "") // Mantiene solo letras, números, #, -, .
            .replaceAll(/\s+/g, " ") // Reemplaza múltiples espacios por uno
            .trim();
    }

    async create(createDto: CreateLocationDto): Promise<Location> {
        try {
            // Verify commune exists
            const commune = await this.communeRepository.findOne({ where: { id: createDto.communeId } });
            if (!commune) {
                throw new BadRequestException(`Comuna con id ${createDto.communeId} no encontrada`);
            }

            const location = this.locationRepository.create(createDto);

            // Normalize address if provided
            if (createDto.address) {
                location.normalizedAddress = this.normalizeAddress(createDto.address);
            }

            return await this.locationRepository.save(location);
        } catch (error) {
            this.handleDBExceptions(error);
            throw error;
        }
    }

    async findForSelect(search?: string, communeId?: string, limit: number = 30, offset: number = 0) {
        const queryBuilder = this.locationRepository
            .createQueryBuilder("location")
            .leftJoinAndSelect("location.commune", "commune")
            .select([
                "location.id",
                "location.address",
                "location.normalizedAddress",
                "commune.id",
                "commune.code",
                "commune.name",
            ]);

        if (search) {
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where("location.address ILIKE :search", { search: `%${search}%` })
                        .orWhere("location.normalizedAddress ILIKE :search", { search: `%${search}%` })
                        .orWhere("commune.name ILIKE :search", { search: `%${search}%` });
                })
            );
        }

        if (communeId) {
            queryBuilder.andWhere("location.communeId = :communeId", { communeId });
        }

        const [data, total] = await queryBuilder
            .orderBy("commune.name", "ASC")
            .addOrderBy("location.address", "ASC")
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

    private handleDBExceptions(error: any) {
        if (error.code === "23505") {
            throw new BadRequestException(error.detail);
        }
        this.logger.error(error);
    }
}
