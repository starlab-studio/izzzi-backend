import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import type { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";
import { IContactRequest, IContactRequestUpdate } from "../../domain/types";

export interface UpdateContactRequestInput {
  id: string;
  data: IContactRequestUpdate;
}

@Injectable()
export class UpdateContactRequestUseCase {
  constructor(
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository,
  ) {}

  async execute(input: UpdateContactRequestInput): Promise<IContactRequest> {
    const contactRequest = await this.contactRequestRepository.findById(
      input.id,
    );

    if (!contactRequest) {
      throw new NotFoundException("Contact request not found");
    }

    contactRequest.update(input.data);
    await this.contactRequestRepository.save(contactRequest);

    return contactRequest.toPersistence();
  }
}
