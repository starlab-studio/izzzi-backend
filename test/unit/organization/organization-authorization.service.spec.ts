import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationAuthorizationService } from "src/modules/organization/domain/services/organization-authorization.service";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { DomainError, ErrorCode, UserRole } from "src/core";
import { GlobalRole } from "src/modules/organization/domain/types";

describe("OrganizationAuthorizationService", () => {
  let service: OrganizationAuthorizationService;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const mockUserRepo = {
      findByIdWithActiveMemberships: jest.fn(),
    };

    userRepository = mockUserRepo as any;
    service = new OrganizationAuthorizationService(userRepository);
  });

  it("should return true when user can access organization", async () => {
    const user = UserEntity.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });

    const membership = MembershipEntity.create({
      userId: user.id,
      organizationId: "org-id",
      role: UserRole.MEMBER,
      addedBy: null,
    });

    user.addMembership(membership);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    const canAccess = await service.canAccess(user.id, "org-id");

    expect(canAccess).toBe(true);
  });

  it("should return false when user cannot access organization", async () => {
    const user = UserEntity.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    const canAccess = await service.canAccess(user.id, "other-org-id");

    expect(canAccess).toBe(false);
  });

  it("should return true when user is super admin", async () => {
    const user = UserEntity.reconstitute({
      id: "user-id",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      phoneNumber: null,
      avatarUrl: null,
      lastLogin: null,
      status: "active" as any,
      role: GlobalRole.SUPER_ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, []);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    const canAccess = await service.canAccess(user.id, "any-org-id");

    expect(canAccess).toBe(true);
  });

  it("should return true when user can manage organization", async () => {
    const user = UserEntity.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
    });

    const membership = MembershipEntity.create({
      userId: user.id,
      organizationId: "org-id",
      role: UserRole.ADMIN,
      addedBy: null,
    });

    user.addMembership(membership);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    const canManage = await service.canManage(user.id, "org-id");

    expect(canManage).toBe(true);
  });

  it("should throw error when user cannot access", async () => {
    const user = UserEntity.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    await expect(service.assertCanAccess(user.id, "other-org-id")).rejects.toThrow(DomainError);
  });

  it("should throw error when user cannot manage", async () => {
    const user = UserEntity.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });

    const membership = MembershipEntity.create({
      userId: user.id,
      organizationId: "org-id",
      role: UserRole.MEMBER,
      addedBy: null,
    });

    user.addMembership(membership);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(user);

    await expect(service.assertCanManage(user.id, "org-id")).rejects.toThrow(DomainError);
  });
});

