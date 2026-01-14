import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { ActionPlanIndicator } from "../action-plan-indicator.entity";
import { Variable } from "../../../variables/variable.entity"; // Reused from Variable module
import { CreateActionPlanIndicatorDto } from "../dto/create-action-plan-indicator.dto";
import { UpdateActionPlanIndicatorDto } from "../dto/update-action-plan-indicator.dto";

@Injectable()
export class ActionPlanIndicatorsService {
  constructor(
    @InjectRepository(ActionPlanIndicator) private repo: Repository<ActionPlanIndicator>,
    @InjectRepository(Variable) private variableRepo: Repository<Variable>
  ) {}

  async create(dto: CreateActionPlanIndicatorDto) {
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

  async update(id: string, dto: UpdateActionPlanIndicatorDto) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException("ActionPlanIndicator not found");

    if (dto.variable_ids) {
      const variables = await this.variableRepo.findBy({
        id: In(dto.variable_ids),
      });
      item.variables = variables;
    }

    Object.assign(item, dto);
    // remove variable_ids from item before saving to avoid error if it tries to save it to DB column
    delete (item as any).variable_ids;

    return this.repo.save(item);
  }
}
