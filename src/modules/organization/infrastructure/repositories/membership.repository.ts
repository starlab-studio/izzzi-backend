import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { MembershipModel } from "../models/membership.model";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IMembership } from "../../domain/types";

export class MembershipRepository implements IMembershipRepository {
  constructor(
    @InjectRepository(MembershipModel)
    private ormRepository: Repository<MembershipModel>
  ) {}

  async create(data: IMembership): Promise<IMembership> {
    const entity = await this.ormRepository.create(data);
    return await this.ormRepository.save(entity);
  }

  async findByUser(userId: string): Promise<IMembership[] | []> {
    return this.ormRepository.findBy({ userId });
  }

  async findByOrganization(
    organizationId: string
  ): Promise<IMembership[] | []> {
    return await this.ormRepository.findBy({ organizationId });
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<IMembership | null> {
    return await this.ormRepository.findOneBy({ userId, organizationId });
  }

  async findById(id: string): Promise<IMembership | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<IMembership[]> {
    return await this.ormRepository.find();
  }

  async update(id: string, entity: IMembership): Promise<IMembership> {
    await this.ormRepository.update(id, entity);
    return (await this.findById(id)) as IMembership;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
