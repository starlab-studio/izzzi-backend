import { Test, TestingModule } from "@nestjs/testing";
import { SendInvitationUseCase } from "src/modules/organization/application/use-cases/send-invitation.use-case";
import { InvitationAuthorizationService } from "src/modules/organization/domain/services/invitation-authorization.service";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { IInvitationRepository } from "src/modules/organization/domain/repositories/invitation.repository";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { IEventStore, ILoggerService, DomainError, ErrorCode, UserRole, LoggerService } from "src/core";
import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";
import { InvitationEntity } from "src/modules/organization/domain/entities/invitation.entity";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";

describe("SendInvitationUseCase", () => {
  let useCase: SendInvitationUseCase;
  let authorizationService: jest.Mocked<InvitationAuthorizationService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let organizationRepository: jest.Mocked<IOrganizationRepository>;
  let invitationRepository: jest.Mocked<IInvitationRepository>;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let eventStore: jest.Mocked<IEventStore>;
  let logger: jest.Mocked<ILoggerService>;

  const mockInviter = UserEntity.create({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
  });

  const mockOrganization = OrganizationEntity.create({
    name: "Test Org",
    ownerId: mockInviter.id,
  });

  beforeEach(async () => {
    const mockAuthService = {
      canUserInviteToOrganization: jest.fn(),
      validateInvitedRole: jest.fn(),
    };

    const mockUserRepo = {
      findByIdWithActiveMemberships: jest.fn(),
      findByEmailWithActiveMemberships: jest.fn(),
    };

    const mockOrgRepo = {
      findById: jest.fn(),
    };

    const mockInvitationRepo = {
      findPendingByEmailAndOrg: jest.fn(),
      create: jest.fn(),
    };

    const mockSubscriptionRepo = {
      findActiveByOrganizationId: jest.fn(),
    };

    const mockEventStore = {
      publish: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    authorizationService = mockAuthService as any;
    userRepository = mockUserRepo as any;
    organizationRepository = mockOrgRepo as any;
    invitationRepository = mockInvitationRepo as any;
    subscriptionRepository = mockSubscriptionRepo as any;
    eventStore = mockEventStore as any;
    logger = mockLogger as any;
    useCase = new SendInvitationUseCase(
      logger,
      eventStore,
      authorizationService,
      userRepository,
      organizationRepository,
      invitationRepository,
      subscriptionRepository
    );
  });

  it("should send invitation successfully", async () => {
    const input = {
      email: "newuser@example.com",
      organizationId: mockOrganization.id,
      role: UserRole.MEMBER,
      invitedBy: mockInviter.id,
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockInviter);
    organizationRepository.findById.mockResolvedValue(mockOrganization);
    userRepository.findByEmailWithActiveMemberships.mockResolvedValue(null);
    invitationRepository.findPendingByEmailAndOrg.mockResolvedValue(null);
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);
    authorizationService.canUserInviteToOrganization.mockResolvedValue(true);
    authorizationService.validateInvitedRole.mockResolvedValue(undefined);

    const invitation = InvitationEntity.create(input);
    invitationRepository.create.mockResolvedValue(invitation);

    const result = await useCase.execute(input);

    expect(result.email).toBe("newuser@example.com");
    expect(invitationRepository.create).toHaveBeenCalled();
    expect(eventStore.publish).toHaveBeenCalled();
  });

  it("should throw error when inviter not found", async () => {
    const input = {
      email: "newuser@example.com",
      organizationId: mockOrganization.id,
      role: UserRole.MEMBER,
      invitedBy: "non-existent",
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when user is already member", async () => {
    const input = {
      email: "existing@example.com",
      organizationId: mockOrganization.id,
      role: UserRole.MEMBER,
      invitedBy: mockInviter.id,
    };

    const existingUser = UserEntity.create({
      firstName: "Existing",
      lastName: "User",
      email: "existing@example.com",
    });

    const membership = MembershipEntity.create({
      userId: existingUser.id,
      organizationId: mockOrganization.id,
      role: UserRole.MEMBER,
      addedBy: null,
    });
    existingUser.addMembership(membership);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockInviter);
    organizationRepository.findById.mockResolvedValue(mockOrganization);
    userRepository.findByEmailWithActiveMemberships.mockResolvedValue(existingUser);
    authorizationService.canUserInviteToOrganization.mockResolvedValue(true);
    authorizationService.validateInvitedRole.mockResolvedValue(undefined);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when invitation already pending", async () => {
    const input = {
      email: "pending@example.com",
      organizationId: mockOrganization.id,
      role: UserRole.MEMBER,
      invitedBy: mockInviter.id,
    };

    const pendingInvitation = InvitationEntity.create(input);

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockInviter);
    organizationRepository.findById.mockResolvedValue(mockOrganization);
    userRepository.findByEmailWithActiveMemberships.mockResolvedValue(null);
    invitationRepository.findPendingByEmailAndOrg.mockResolvedValue(pendingInvitation);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });
});

