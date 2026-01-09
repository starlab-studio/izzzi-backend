import { InvitationEntity } from "src/modules/organization/domain/entities/invitation.entity";
import { IInvitationCreate, InvitationStatus, IInvitation } from "src/modules/organization/domain/types";
import { UserRole, DomainError, ErrorCode } from "src/core";
import { DateUtils } from "src/utils/date.utils";

describe("InvitationEntity", () => {
  describe("create", () => {
    it("should create invitation with required fields", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);

      expect(invitation.id).toBeDefined();
      expect(invitation.email).toBe("test@example.com");
      expect(invitation.organizationId).toBe("org-123");
      expect(invitation.role).toBe(UserRole.LEARNING_MANAGER);
      expect(invitation.invitedBy).toBe("admin-123");
      expect(invitation.token).toBeDefined();
      expect(invitation.token.length).toBeGreaterThan(0);
      expect(invitation.status).toBe(InvitationStatus.PENDING);
    });

    it("should set expiration to 72 hours from now", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const before = new Date();
      const invitation = InvitationEntity.create(data);
      const after = new Date();

      const expectedMin = DateUtils.addHours(before, 72);
      const expectedMax = DateUtils.addHours(after, 72);

      expect(invitation.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(invitation.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });

  describe("isValid", () => {
    it("should return true for pending non-expired invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);

      expect(invitation.isValid()).toBe(true);
    });

    it("should return false for expired invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      (invitation as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(invitation.isValid()).toBe(false);
    });

    it("should return false for accepted invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsAccepted();

      expect(invitation.isValid()).toBe(false);
    });

    it("should return false for revoked invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsRevoked();

      expect(invitation.isValid()).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("should return false for future expiration", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);

      expect(invitation.isExpired()).toBe(false);
    });

    it("should return true for past expiration", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      (invitation as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(invitation.isExpired()).toBe(true);
    });
  });

  describe("markAsAccepted", () => {
    it("should mark invitation as accepted", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsAccepted();

      expect(invitation.status).toBe(InvitationStatus.ACCEPDED);
    });

    it("should throw error for expired invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      (invitation as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(() => invitation.markAsAccepted()).toThrow(DomainError);
    });

    it("should throw error for already accepted invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsAccepted();

      expect(() => invitation.markAsAccepted()).toThrow(DomainError);
    });

    it("should throw error for revoked invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsRevoked();

      expect(() => invitation.markAsAccepted()).toThrow(DomainError);
    });
  });

  describe("markAsRevoked", () => {
    it("should mark pending invitation as revoked", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsRevoked();

      expect(invitation.status).toBe(InvitationStatus.REVOKED);
    });

    it("should throw error for already accepted invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsAccepted();

      expect(() => invitation.markAsRevoked()).toThrow(DomainError);
    });

    it("should throw error for already revoked invitation", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      invitation.markAsRevoked();

      expect(() => invitation.markAsRevoked()).toThrow(DomainError);
    });
  });

  describe("toPersistance", () => {
    it("should return persistence data", () => {
      const data: IInvitationCreate = {
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
      };

      const invitation = InvitationEntity.create(data);
      const persistence = invitation.toPersistance();

      expect(persistence.id).toBe(invitation.id);
      expect(persistence.email).toBe("test@example.com");
      expect(persistence.token).toBe(invitation.token);
    });
  });

  describe("reconstitute", () => {
    it("should recreate invitation from persistence data", () => {
      const data: IInvitation = {
        id: "existing-id",
        email: "test@example.com",
        organizationId: "org-123",
        role: UserRole.LEARNING_MANAGER,
        invitedBy: "admin-123",
        token: "existing-token",
        status: InvitationStatus.ACCEPDED,
        expiresAt: new Date(),
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invitation = InvitationEntity.reconstitute(data);

      expect(invitation.id).toBe("existing-id");
      expect(invitation.status).toBe(InvitationStatus.ACCEPDED);
      expect(invitation.token).toBe("existing-token");
    });
  });
});

