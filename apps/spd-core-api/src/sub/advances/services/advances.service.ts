import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VariableAdvance } from "../variable-advance.entity";
import { Variable } from "../../../masters/variables/variable.entity";
import { CreateAdvanceDto } from "../dto/create-advance.dto";
import { OutboxService } from "../../../outbox/outbox.service";

@Injectable()
export class AdvancesService {
  constructor(
    @InjectRepository(VariableAdvance) private repo: Repository<VariableAdvance>,
    @InjectRepository(Variable) private variables: Repository<Variable>,
    private outbox: OutboxService
  ) { }

  async create(dto: CreateAdvanceDto) {
    const variable = await this.variables.findOne({ where: { id: dto.variable_id } });
    if (!variable) throw new NotFoundException("Variable not found");

    const entity = await this.repo.save(
      this.repo.create({
        variable,
        value: dto.value,
        period_type: dto.period_type,
        period_key: dto.period_key,
      })
    );

    await this.outbox.enqueue("SPD.SUB_VARIABLE_ADVANCE_CREATED", {
      id: entity.id,
      variableId: variable.id,
      value: entity.value,
      periodType: entity.period_type,
      periodKey: entity.period_key,
      occurredAt: new Date().toISOString(),
    });

    return entity;
  }

  list() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }
}
