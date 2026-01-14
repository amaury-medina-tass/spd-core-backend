import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { IndicativePlanIndicator } from "../indicative-plan-indicator.entity";
import { Variable } from "../../../variables/variable.entity";
import { CreateIndicativePlanIndicatorDto } from "../dto/create-indicative-plan-indicator.dto";
import { UpdateIndicativePlanIndicatorDto } from "../dto/update-indicative-plan-indicator.dto";

@Injectable()
export class IndicativePlanIndicatorsService {
  constructor(
    @InjectRepository(IndicativePlanIndicator)
    private repo: Repository<IndicativePlanIndicator>,
    @InjectRepository(Variable) private variableRepo: Repository<Variable>
  ) {}

  async create(dto: CreateIndicativePlanIndicatorDto) {
    const variables = await this.variableRepo.findBy({
      id: In(dto.variable_ids),
    });

    const entity = this.repo.create({
      ...dto,
      variables,
    });

    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateIndicativePlanIndicatorDto) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException("IndicativePlanIndicator not found");

    if (dto.variable_ids) {
      const variables = await this.variableRepo.findBy({
        id: In(dto.variable_ids),
      });
      item.variables = variables;
    }

    Object.assign(item, dto);
    delete (item as any).variable_ids;

    return this.repo.save(item);
  }
}
