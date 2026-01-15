import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Variable } from "../variable.entity";
import { CreateVariableDto } from "../dto/create-variable.dto";
import { UpdateVariableDto } from "../dto/update-variable.dto";

@Injectable()
export class VariablesService {
  constructor(@InjectRepository(Variable) private repo: Repository<Variable>) { }

  create(dto: CreateVariableDto) {
    return this.repo.save(
      this.repo.create({
        ...dto,
        value_type: dto.value_type ?? "number",
        is_active: dto.is_active ?? true,
      })
    );
  }

  findAll() {
    return this.repo.find({ order: { createAt: "DESC" } });
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Variable not found");
    return item;
  }

  async update(id: string, dto: UpdateVariableDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }
}
