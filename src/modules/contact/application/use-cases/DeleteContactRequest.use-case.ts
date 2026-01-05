import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import type { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";

@Injectable()
export class DeleteContactRequestUseCase {
  constructor(
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository
  ) {}

  async execute(id: string): Promise<void> {
    const contactRequest = await this.contactRequestRepository.findById(id);

    if (!contactRequest) {
      throw new NotFoundException("Contact request not found");
    }

    await this.contactRequestRepository.delete(id);
  }
}

