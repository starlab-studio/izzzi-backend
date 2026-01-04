import { randomUUID } from "crypto";
import {
  ContactRequestStatus,
  IContactRequest,
  IContactRequestCreate,
  IContactRequestUpdate,
} from "../types";

export class ContactRequestEntity {
  private props: IContactRequest;

  private constructor(props: IContactRequest) {
    this.props = props;
  }

  public static create(data: IContactRequestCreate): ContactRequestEntity {
    const now = new Date();

    return new ContactRequestEntity({
      id: randomUUID(),
      ...data,
      status: ContactRequestStatus.PENDING,
      notes: null,
      processedBy: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public update(data: IContactRequestUpdate): void {
    this.props = {
      ...this.props,
      status: data.status ?? this.props.status,
      notes: data.notes ?? this.props.notes,
      processedBy: data.processedBy ?? this.props.processedBy,
      processedAt:
        data.status && data.status !== this.props.status
          ? new Date()
          : this.props.processedAt,
      updatedAt: new Date(),
    };
  }

  public markAsInProgress(processedBy: string): void {
    this.props = {
      ...this.props,
      status: ContactRequestStatus.IN_PROGRESS,
      processedBy,
      processedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public markAsResolved(processedBy: string, notes?: string): void {
    this.props = {
      ...this.props,
      status: ContactRequestStatus.RESOLVED,
      processedBy,
      notes: notes ?? this.props.notes,
      processedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public archive(): void {
    this.props = {
      ...this.props,
      status: ContactRequestStatus.ARCHIVED,
      updatedAt: new Date(),
    };
  }

  get id(): string {
    return this.props.id;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get organizationName(): string | null {
    return this.props.organizationName;
  }
  get numberOfClasses(): number | null {
    return this.props.numberOfClasses;
  }
  get message(): string {
    return this.props.message;
  }
  get status(): ContactRequestStatus {
    return this.props.status;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get processedBy(): string | null {
    return this.props.processedBy;
  }
  get processedAt(): Date | null {
    return this.props.processedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IContactRequest {
    return { ...this.props };
  }

  static reconstitute(data: IContactRequest): ContactRequestEntity {
    return new ContactRequestEntity(data);
  }
}

