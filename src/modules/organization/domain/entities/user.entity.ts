import { randomUUID } from "crypto";
import {
  GlobalRole,
  IUser,
  IUserCreate,
  IUserReconstitute,
  UserStatus,
} from "../types";
import { MembershipEntity } from "./membership.entity";
import { DomainError, UserRole } from "src/core";

export class UserEntity {
  private props: IUser;
  private memberships: MembershipEntity[];

  private constructor(props: IUser, memberships: MembershipEntity[] = []) {
    this.props = props;
    this.memberships = memberships;
  }

  public static create(data: IUserCreate): UserEntity {
    const now = new Date();

    return new UserEntity({
      id: randomUUID(),
      ...data,
      phoneNumber: null,
      avatarUrl: null,
      lastLogin: null,
      status: UserStatus.PENDING,
      role: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.memberships.some(
      (m) => m.organizationId === organizationId && m.isActive()
    );
  }

  hasRoleInOrganization(organizationId: string, role: UserRole): boolean {
    const membership = this.findActiveMembership(organizationId);
    return membership?.hasRole(role) ?? false;
  }

  hasAnyRoleInOrganization(organizationId: string, roles: UserRole[]): boolean {
    const membership = this.findActiveMembership(organizationId);
    return membership?.hasAnyRole(roles) ?? false;
  }

  getRoleInOrganization(organizationId: string): UserRole | null {
    return this.findActiveMembership(organizationId)?.role ?? null;
  }

  canInviteMembersTo(organizationId: string): boolean {
    const membership = this.findActiveMembership(organizationId);
    return membership?.canInviteMembers() ?? false;
  }

  getOrganizationIds(): string[] {
    return this.memberships
      .filter((m) => m.isActive())
      .map((m) => m.organizationId);
  }

  addMembership(membership: MembershipEntity): void {
    if (this.belongsToOrganization(membership.organizationId)) {
      throw new DomainError(
        "ALREADY_MEMBER",
        "User is already a member of this organization"
      );
    }
    this.memberships.push(membership);
    this.updateTimestamp();
  }

  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) {
      throw new DomainError("ALREADY_ACTIVE", "User is already active");
    }
    this.props = {
      ...this.props,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    };
  }

  suspend(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new DomainError("ALREADY_SUSPENDED", "User is already suspended");
    }
    this.props = {
      ...this.props,
      status: UserStatus.SUSPENDED,
      updatedAt: new Date(),
    };
  }

  recordLogin(): void {
    this.props = {
      ...this.props,
      lastLogin: new Date(),
      updatedAt: new Date(),
    };
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }): void {
    this.props = {
      ...this.props,
      firstName: data.firstName ?? this.props.firstName,
      lastName: data.lastName ?? this.props.lastName,
      phoneNumber: data.phoneNumber ?? this.props.phoneNumber,
      avatarUrl: data.avatarUrl ?? this.props.avatarUrl,
      updatedAt: new Date(),
    };
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isSuperAdmin(): boolean {
    return this.props.role === GlobalRole.SUPER_ADMIN;
  }

  private findActiveMembership(
    organizationId: string
  ): MembershipEntity | undefined {
    return this.memberships.find(
      (m) => m.organizationId === organizationId && m.isActive()
    );
  }

  private updateTimestamp(): void {
    this.props = {
      ...this.props,
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
  get phoneNumber(): string | null {
    return this.props.phoneNumber;
  }
  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }
  get lastLogin(): Date | null {
    return this.props.lastLogin;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get role(): GlobalRole | null {
    return this.props.role;
  }

  toPersistence(): IUser {
    return { ...this.props };
  }

  static reconstitute(data: IUserReconstitute): UserEntity {
    return new UserEntity(data, data.memberships || []);
  }
}
