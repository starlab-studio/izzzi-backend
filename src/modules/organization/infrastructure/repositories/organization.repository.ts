import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { IOrganization, IOrganizationCreate } from "../../domain/types";
import { Organization } from "../models/organization.model";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private ormRepository: Repository<Organization>
  ) {}

  async create(data: IOrganizationCreate): Promise<IOrganization> {
    const entity = this.ormRepository.create(data);
    return await this.ormRepository.save(entity);
  }

  async findById(id: string): Promise<IOrganization | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<IOrganization | null> {
    return await this.ormRepository.findOneBy({ name });
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return await this.ormRepository.findOneBy({ slug });
  }

  async findByOwner(ownerId: string): Promise<IOrganization[] | []> {
    return await this.ormRepository.findBy({ ownerId });
  }

  async findAll(): Promise<IOrganization[]> {
    return await this.ormRepository.find();
  }

  async update(id: string, entity: IOrganization): Promise<IOrganization> {
    await this.ormRepository.update(id, entity);
    return (await this.findById(id)) as IOrganization;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
