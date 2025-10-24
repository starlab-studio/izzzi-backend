import { IDomainEvent } from "./core.event";

export interface AuthIdentityCreatedPayload {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  provider: string;
  providerUserId: string;
}

export interface UserCreatedPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type AuthIdentityCreatedEvent = IDomainEvent<AuthIdentityCreatedPayload>;
export type UserCreatedEvent = IDomainEvent<UserCreatedPayload>;
