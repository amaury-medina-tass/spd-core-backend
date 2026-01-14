import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { MgaActivity } from "../mga-activity.entity";
import { CreateMgaActivityDto } from "../dto/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dto/update-mga-activity.dto";

@Injectable()
export class MgaActivitiesService {
  constructor(
    @InjectRepository(MgaActivity) private repo: Repository<MgaActivity>
  ) {}

  async create(dto: CreateMgaActivityDto) {
    const activity = this.repo.create({
      ...dto,
    });
    return this.repo.save(activity);
  }

  findAll() {
    return this.repo.find({ order: { creationDate: "DESC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateMgaActivityDto) {
    const activity = await this.findOne(id);
    if (!activity) throw new NotFoundException("MGA Activity not found");

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

    const sortableFields = ["creationDate", "name", "code", "projectCode"];
    const validSortBy = sortBy && sortableFields.includes(sortBy) ? sortBy : "creationDate";
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
