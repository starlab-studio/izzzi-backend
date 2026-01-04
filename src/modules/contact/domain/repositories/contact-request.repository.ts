import { ContactRequestEntity } from "../entities/contact-request.entity";
import { ContactRequestStatus } from "../types";

export interface IContactRequestRepository {
  save(contactRequest: ContactRequestEntity): Promise<void>;
  findById(id: string): Promise<ContactRequestEntity | null>;
  findAll(filters?: {
    status?: ContactRequestStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ContactRequestEntity[]; total: number }>;
  delete(id: string): Promise<void>;
}

