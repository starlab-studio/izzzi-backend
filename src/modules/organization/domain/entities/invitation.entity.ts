import { randomUUID } from "crypto";

import { DomainError, ErrorCode, UserRole } from "src/core";
import { DateUtils } from "src/utils/date.utils";
import { GeneralUtils } from "src/utils/general.utils";
import { IInvitation, IInvitationCreate, InvitationStatus } from "../types";

export class InvitationEntity {
  private props: IInvitation;

  private constructor(props: IInvitation) {
    this.props = props;
  }

  public static create(data: IInvitationCreate) {
    const now = new Date();

    return new InvitationEntity({
      id: randomUUID(),
      ...data,
      token: GeneralUtils.generateToken(32),
      status: InvitationStatus.PENDING,
      expiresAt: DateUtils.addHours(now, 72),
      acceptedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  isValid(): boolean {
    return this.props.status === InvitationStatus.PENDING && !this.isExpired();
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  markAsAccepted(): void {
    if (!this.isValid())
      throw new DomainError(
        ErrorCode.INVALID_OR_EXPIRED_INVITATION,
        "Cannot accept invalid or expired invitation"
      );

    this.props = {
      ...this.props,
      status: InvitationStatus.ACCEPDED,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  markAsRevoked(): void {
    if (this.props.status !== InvitationStatus.PENDING)
      throw new DomainError(
        ErrorCode.CANNOT_REVOKE_INVITATION,
        "Can only revoke pending invitations"
      );

    this.props = {
      ...this.props,
      status: InvitationStatus.REVOKED,
      updatedAt: new Date(),
    };
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get invitedBy(): string {
    return this.props.invitedBy;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get token(): string {
    return this.props.token;
  }
  get status(): InvitationStatus {
    return this.props.status;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  toPersistance(): IInvitation {
    return { ...this.props };
  }

  static reconstitute(data: IInvitation): InvitationEntity {
    return new InvitationEntity(data);
  }
}
