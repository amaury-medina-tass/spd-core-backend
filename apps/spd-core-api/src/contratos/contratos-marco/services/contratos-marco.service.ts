import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContratoMarco } from "../contrato-marco.entity";
import { Cdp } from "../../../financial/cdp/cdp.entity";
import { CreateContratoMarcoDto } from "../dto/create-contrato-marco.dto";
import { OutboxService } from "../../../outbox/outbox.service";

@Injectable()
export class ContratosMarcoService {
  constructor(
    @InjectRepository(ContratoMarco) private repo: Repository<ContratoMarco>,
    @InjectRepository(Cdp) private cdps: Repository<Cdp>,
    private outbox: OutboxService
  ) { }

  async create(dto: CreateContratoMarcoDto) {
    const cdp = await this.cdps.findOne({ where: { id: dto.cdp_id } });
    if (!cdp) throw new NotFoundException("CDP not found");

    const entity = await this.repo.save(
      this.repo.create({
        contract_number: dto.contract_number,
        cdp,
        consumed_value: dto.consumed_value,
      })
    );

    await this.outbox.enqueue("SPD.CONTRATO_MARCO_CREATED", {
      id: entity.id,
      contractNumber: entity.contract_number,
      cdpId: cdp.id,
      consumedValue: entity.consumed_value,
      occurredAt: new Date().toISOString(),
    });

    return entity;
  }

  list() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }
}
