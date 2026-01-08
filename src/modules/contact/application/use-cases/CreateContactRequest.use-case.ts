import { Injectable, Inject } from "@nestjs/common";
import type { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";
import { ContactRequestEntity } from "../../domain/entities/contact-request.entity";
import { IContactRequestCreate } from "../../domain/types";

@Injectable()
export class CreateContactRequestUseCase {
  constructor(
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository,
  ) {}

  async execute(data: IContactRequestCreate): Promise<{ id: string }> {
    const contactRequest = ContactRequestEntity.create(data);
    await this.contactRequestRepository.save(contactRequest);

    return { id: contactRequest.id };
  }
}
