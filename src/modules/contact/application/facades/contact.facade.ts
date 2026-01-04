import { Injectable } from "@nestjs/common";
import { CreateContactRequestUseCase } from "../use-cases/CreateContactRequest.use-case";
import {
  GetContactRequestsUseCase,
  GetContactRequestsInput,
  GetContactRequestsOutput,
} from "../use-cases/GetContactRequests.use-case";
import { UpdateContactRequestUseCase } from "../use-cases/UpdateContactRequest.use-case";
import { DeleteContactRequestUseCase } from "../use-cases/DeleteContactRequest.use-case";
import { IContactRequest, IContactRequestCreate, IContactRequestUpdate } from "../../domain/types";

@Injectable()
export class ContactFacade {
  constructor(
    private readonly createContactRequestUseCase: CreateContactRequestUseCase,
    private readonly getContactRequestsUseCase: GetContactRequestsUseCase,
    private readonly updateContactRequestUseCase: UpdateContactRequestUseCase,
    private readonly deleteContactRequestUseCase: DeleteContactRequestUseCase
  ) {}

  async createContactRequest(data: IContactRequestCreate): Promise<{ id: string }> {
    return this.createContactRequestUseCase.execute(data);
  }

  async getContactRequests(input: GetContactRequestsInput): Promise<GetContactRequestsOutput> {
    return this.getContactRequestsUseCase.execute(input);
  }

  async updateContactRequest(
    id: string,
    data: IContactRequestUpdate
  ): Promise<IContactRequest> {
    return this.updateContactRequestUseCase.execute({ id, data });
  }

  async deleteContactRequest(id: string): Promise<void> {
    return this.deleteContactRequestUseCase.execute(id);
  }
}

