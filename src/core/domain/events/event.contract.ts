import { IDomainEvent } from "./core.event";

export interface UserCreatedPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type UserCreatedEvent = IDomainEvent<UserCreatedPayload>;
