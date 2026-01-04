import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";
import { ContactRequestEntity } from "../../domain/entities/contact-request.entity";
import { ContactRequestModel } from "../models/contact-request.model";
import { ContactRequestStatus } from "../../domain/types";

@Injectable()
export class ContactRequestRepositoryImpl implements IContactRequestRepository {
  constructor(
    @InjectRepository(ContactRequestModel)
    private readonly repository: Repository<ContactRequestModel>
  ) {}

  async save(contactRequest: ContactRequestEntity): Promise<void> {
    const data = contactRequest.toPersistence();
    await this.repository.save(data);
  }

  async findById(id: string): Promise<ContactRequestEntity | null> {
    const model = await this.repository.findOne({ where: { id } });
    if (!model) return null;
    return ContactRequestEntity.reconstitute(model);
  }

  async findAll(filters?: {
    status?: ContactRequestStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ContactRequestEntity[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder("contact_request");

    if (filters?.status) {
      queryBuilder.andWhere("contact_request.status = :status", {
        status: filters.status,
      });
    }

    queryBuilder.orderBy("contact_request.created_at", "DESC");

    if (filters?.limit) {
      queryBuilder.take(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.skip(filters.offset);
    }

    const [models, total] = await queryBuilder.getManyAndCount();
    const data = models.map((model) => ContactRequestEntity.reconstitute(model));

    return { data, total };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

