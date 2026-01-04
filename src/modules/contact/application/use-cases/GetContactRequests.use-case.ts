import { Injectable, Inject } from "@nestjs/common";
import type { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";
import { ContactRequestStatus, IContactRequest } from "../../domain/types";

export interface GetContactRequestsInput {
  status?: ContactRequestStatus;
  limit?: number;
  offset?: number;
}

export interface GetContactRequestsOutput {
  data: IContactRequest[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class GetContactRequestsUseCase {
  constructor(
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository
  ) {}

  async execute(input: GetContactRequestsInput): Promise<GetContactRequestsOutput> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    const { data, total } = await this.contactRequestRepository.findAll({
      status: input.status,
      limit,
      offset,
    });

    return {
      data: data.map((entity) => entity.toPersistence()),
      total,
      limit,
      offset,
    };
  }
}

