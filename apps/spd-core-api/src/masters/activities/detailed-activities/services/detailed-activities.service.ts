import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { DetailedActivity } from "../detailed-activity.entity";
import { CreateDetailedActivityDto } from "../dto/create-detailed-activity.dto";
import { UpdateDetailedActivityDto } from "../dto/update-detailed-activity.dto";

@Injectable()
export class DetailedActivitiesService {
  constructor(
    @InjectRepository(DetailedActivity) private repo: Repository<DetailedActivity>
  ) {}

  async create(dto: CreateDetailedActivityDto) {
    const activity = this.repo.create({
      ...dto,
    });
    return this.repo.save(activity);
  }

  findAll() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateDetailedActivityDto) {
    const activity = await this.findOne(id);
    if (!activity) throw new NotFoundException("Detailed Activity not found");

    Object.assign(activity, dto);
    return this.repo.save(activity);
  }
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC"
  ) {
    const skip = (page - 1) * limit;

    let whereCondition: any = {};

    if (search) {
      whereCondition = [
        { name: ILike(`%${search}%`) },
        { observations: ILike(`%${search}%`) },
      ];
    }

    const sortableFields = [
      "createAt",
      "name",
      "code",
      "projectCode",
      "cpc",
      "balance",
    ];
    const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "createAt";
    const validSortOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

    const [data, total] = await this.repo.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { [validSortBy]: validSortOrder },
    });

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
}
