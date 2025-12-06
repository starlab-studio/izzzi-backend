import { randomUUID } from "crypto";

import { DomainError, ErrorCode, UserRole } from "src/core";
import { IMembership, IMembershipCreate, MembershipStatus } from "../types";

export class MembershipEntity {
  private props: IMembership;

  private constructor(props: IMembership) {
    this.props = props;
  }

  public static create(data: IMembershipCreate) {
    const now = new Date();

    return new MembershipEntity({
      id: randomUUID(),
      ...data,
      status: MembershipStatus.ACTIVE,
      leftAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  isActive(): boolean {
    return this.props.status === MembershipStatus.ACTIVE;
  }

  hasRole(role: UserRole): boolean {
    return this.props.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.props.role);
  }

  canInviteMembers(): boolean {
    return this.props.role !== UserRole.ADMIN;
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get addedBy(): string | null {
    return this.props.addedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updated(): Date {
    return this.props.updatedAt;
  }

  toPersistance(): IMembership {
    return { ...this.props };
  }

  static reconstitute(data: IMembership): MembershipEntity {
    return new MembershipEntity(data);
  }
}
