import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { IMembershipCreate, MembershipStatus, IMembershipReconstitute } from "src/modules/organization/domain/types";
import { UserRole } from "src/core";
import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";

describe("MembershipEntity", () => {
  describe("create", () => {
    it("should create membership with required fields", () => {
      const data: IMembershipCreate = {
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: "admin-123",
      };

      const membership = MembershipEntity.create(data);

      expect(membership.id).toBeDefined();
      expect(membership.userId).toBe("user-123");
      expect(membership.organizationId).toBe("org-123");
      expect(membership.role).toBe(UserRole.ADMIN);
      expect(membership.status).toBe(MembershipStatus.ACTIVE);
      expect(membership.addedBy).toBe("admin-123");
      expect(membership.leftAt).toBeNull();
    });

    it("should create membership without addedBy", () => {
      const data: IMembershipCreate = {
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        addedBy: null,
      };

      const membership = MembershipEntity.create(data);

      expect(membership.addedBy).toBeNull();
    });
  });

  describe("isActive", () => {
    it("should return true for active membership", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      expect(membership.isActive()).toBe(true);
    });

    it("should return false for deleted membership", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      membership.markAsDeleted();

      expect(membership.isActive()).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("should return true when role matches", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      expect(membership.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it("should return false when role does not match", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        addedBy: null,
      });

      expect(membership.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe("hasAnyRole", () => {
    it("should return true when role is in array", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        addedBy: null,
      });

      expect(membership.hasAnyRole([UserRole.ADMIN, UserRole.LEARNING_MANAGER])).toBe(true);
    });

    it("should return false when role is not in array", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      expect(membership.hasAnyRole([UserRole.LEARNING_MANAGER, UserRole.TEACHER])).toBe(false);
    });
  });

  describe("canInviteMembers", () => {
    it("should return false for admin role", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      expect(membership.canInviteMembers()).toBe(false);
    });

    it("should return true for non-admin roles", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        addedBy: null,
      });

      expect(membership.canInviteMembers()).toBe(true);
    });
  });

  describe("updateRole", () => {
    it("should update role", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        addedBy: null,
      });

      membership.updateRole(UserRole.ADMIN);

      expect(membership.role).toBe(UserRole.ADMIN);
    });
  });

  describe("markAsDeleted", () => {
    it("should mark membership as deleted", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      membership.markAsDeleted();

      expect(membership.status).toBe(MembershipStatus.DELETED);
      expect(membership.leftAt).toBeDefined();
    });
  });

  describe("reactivate", () => {
    it("should reactivate deleted membership", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      membership.markAsDeleted();
      membership.reactivate();

      expect(membership.status).toBe(MembershipStatus.ACTIVE);
      expect(membership.leftAt).toBeNull();
    });

    it("should reactivate with new role", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      membership.markAsDeleted();
      membership.reactivate(UserRole.LEARNING_MANAGER);

      expect(membership.status).toBe(MembershipStatus.ACTIVE);
      expect(membership.role).toBe(UserRole.LEARNING_MANAGER);
    });

    it("should keep existing role when no new role provided", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      membership.markAsDeleted();
      membership.reactivate();

      expect(membership.role).toBe(UserRole.ADMIN);
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const membership = MembershipEntity.create({
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        addedBy: null,
      });

      const persistence = membership.toPersistence();

      expect(persistence.id).toBe(membership.id);
      expect(persistence.userId).toBe("user-123");
      expect(persistence.organizationId).toBe("org-123");
      expect(persistence.role).toBe(UserRole.ADMIN);
    });
  });

  describe("reconstitute", () => {
    it("should recreate membership from persistence data", () => {
      const data: IMembershipReconstitute = {
        id: "existing-id",
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        status: MembershipStatus.ACTIVE,
        addedBy: "admin-123",
        leftAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const membership = MembershipEntity.reconstitute(data);

      expect(membership.id).toBe("existing-id");
      expect(membership.status).toBe(MembershipStatus.ACTIVE);
    });

    it("should reconstitute with organization and user", () => {
      const org = OrganizationEntity.create({
        name: "Test Org",
        ownerId: "owner-123",
      });

      const data: IMembershipReconstitute = {
        id: "existing-id",
        userId: "user-123",
        organizationId: "org-123",
        role: UserRole.ADMIN,
        status: MembershipStatus.ACTIVE,
        addedBy: null,
        leftAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: org,
      };

      const membership = MembershipEntity.reconstitute(data);

      expect(membership.organization).toBeDefined();
    });
  });
});

