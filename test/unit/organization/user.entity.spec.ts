import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { IUserCreate, UserStatus, GlobalRole } from "src/modules/organization/domain/types";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { UserRole, DomainError } from "src/core";

describe("UserEntity", () => {
  describe("create", () => {
    it("should create user with required fields", () => {
      const data: IUserCreate = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      };

      const entity = UserEntity.create(data);

      expect(entity.id).toBeDefined();
      expect(entity.firstName).toBe("John");
      expect(entity.lastName).toBe("Doe");
      expect(entity.email).toBe("john@example.com");
      expect(entity.status).toBe(UserStatus.PENDING);
      expect(entity.phoneNumber).toBeNull();
      expect(entity.avatarUrl).toBeNull();
      expect(entity.lastLogin).toBeNull();
      expect(entity.role).toBeNull();
    });
  });

  describe("belongsToOrganization", () => {
    it("should return true when user has active membership", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const membership = MembershipEntity.create({
        userId: entity.id,
        organizationId: "org-123",
        role: UserRole.ADMIN,
      });

      (entity as any).memberships = [membership];

      expect(entity.belongsToOrganization("org-123")).toBe(true);
    });

    it("should return false when user has no membership", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      expect(entity.belongsToOrganization("org-123")).toBe(false);
    });
  });

  describe("hasRoleInOrganization", () => {
    it("should return true when user has role", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const membership = MembershipEntity.create({
        userId: entity.id,
        organizationId: "org-123",
        role: UserRole.ADMIN,
      });

      (entity as any).memberships = [membership];

      expect(entity.hasRoleInOrganization("org-123", UserRole.ADMIN)).toBe(true);
    });

    it("should return false when user has different role", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const membership = MembershipEntity.create({
        userId: entity.id,
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
      });

      (entity as any).memberships = [membership];

      expect(entity.hasRoleInOrganization("org-123", UserRole.ADMIN)).toBe(false);
    });
  });

  describe("activate", () => {
    it("should activate user", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.activate();

      expect(entity.status).toBe(UserStatus.ACTIVE);
    });

    it("should throw error when already active", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.activate();

      expect(() => entity.activate()).toThrow(DomainError);
    });
  });

  describe("suspend", () => {
    it("should suspend user", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.suspend();

      expect(entity.status).toBe(UserStatus.SUSPENDED);
    });

    it("should throw error when already suspended", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.suspend();

      expect(() => entity.suspend()).toThrow(DomainError);
    });
  });

  describe("markAsDeleted", () => {
    it("should mark user as deleted", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.markAsDeleted();

      expect(entity.status).toBe(UserStatus.DELETED);
      expect(entity.isDeleted()).toBe(true);
    });
  });

  describe("recordLogin", () => {
    it("should update last login timestamp", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.recordLogin();

      expect(entity.lastLogin).toBeDefined();
    });
  });

  describe("updateProfile", () => {
    it("should update profile fields", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.updateProfile({
        firstName: "Jane",
        phoneNumber: "+33123456789",
      });

      expect(entity.firstName).toBe("Jane");
      expect(entity.lastName).toBe("Doe");
      expect(entity.phoneNumber).toBe("+33123456789");
    });
  });

  describe("updateEmail", () => {
    it("should update email", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.updateEmail("newemail@example.com");

      expect(entity.email).toBe("newemail@example.com");
    });

    it("should trim whitespace", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.updateEmail("  newemail@example.com  ");

      expect(entity.email).toBe("newemail@example.com");
    });
  });

  describe("isActive", () => {
    it("should return true for active user", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      entity.activate();

      expect(entity.isActive()).toBe(true);
    });

    it("should return false for pending user", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      expect(entity.isActive()).toBe(false);
    });
  });

  describe("isSuperAdmin", () => {
    it("should return true for super admin", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      (entity as any).props.role = GlobalRole.SUPER_ADMIN;

      expect(entity.isSuperAdmin()).toBe(true);
    });

    it("should return false for regular user", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      expect(entity.isSuperAdmin()).toBe(false);
    });
  });

  describe("addMembership", () => {
    it("should add membership", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const membership = MembershipEntity.create({
        userId: entity.id,
        organizationId: "org-123",
        role: UserRole.ADMIN,
      });

      entity.addMembership(membership);

      expect(entity.belongsToOrganization("org-123")).toBe(true);
    });

    it("should throw error for duplicate membership", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const membership = MembershipEntity.create({
        userId: entity.id,
        organizationId: "org-123",
        role: UserRole.ADMIN,
      });

      entity.addMembership(membership);

      expect(() => entity.addMembership(membership)).toThrow(DomainError);
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const entity = UserEntity.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Test Org",
        authIdentityId: "auth-123",
      });

      const persistence = entity.toPersistence();

      expect(persistence.id).toBe(entity.id);
      expect(persistence.firstName).toBe("John");
      expect(persistence.email).toBe("john@example.com");
    });
  });
});

