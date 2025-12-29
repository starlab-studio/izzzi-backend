import { randomUUID } from "crypto";

import { DomainError, ErrorCode, UserRole } from "src/core";
import {
  IMembership,
  IMembershipCreate,
  MembershipStatus,
  IMembershipReconstitute,
  IUser,
} from "../types";
import { OrganizationEntity } from "./organization.entity";

export class MembershipEntity {
  private props: IMembership;
  private _organization?: OrganizationEntity;
  private _user?: IUser;

  private constructor(props: IMembership, organization?: OrganizationEntity, user?: IUser) {
    this.props = props;
    this._organization = organization;
    this._user = user;
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

  updateRole(newRole: UserRole): void {
    this.props = {
      ...this.props,
      role: newRole,
      updatedAt: new Date(),
    };
  }

  markAsDeleted(): void {
    this.props = {
      ...this.props,
      status: MembershipStatus.DELETED,
      leftAt: new Date(),
      updatedAt: new Date(),
    };
  }

  reactivate(role?: UserRole): void {
    this.props = {
      ...this.props,
      status: MembershipStatus.ACTIVE,
      role: role ?? this.props.role,
      leftAt: null,
      updatedAt: new Date(),
    };
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
  get status(): MembershipStatus {
    return this.props.status;
  }
  get addedBy(): string | null {
    return this.props.addedBy;
  }
  get leftAt(): Date | null {
    return this.props.leftAt;
  }
  get status(): MembershipStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updated(): Date {
    return this.props.updatedAt;
  }
  get organization(): OrganizationEntity | undefined {
    return this._organization;
  }

  get user(): IUser | undefined {
    return this._user;
  }

  toPersistence(): IMembership {
    return { ...this.props };
  }

  static reconstitute(data: IMembershipReconstitute): MembershipEntity {
    return new MembershipEntity(data, data.organization || undefined, data.user || undefined);
  }
}
