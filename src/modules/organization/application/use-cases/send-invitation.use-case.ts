import {
  ApplicationError,
  BaseUseCase,
  DomainError,
  Email,
  ErrorCode,
  IEventStore,
  ILoggerService,
  IUseCase,
  HTTP_STATUS,
  UserRole,
} from "src/core";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";

import { IInvitation, IInvitationCreate } from "../../domain/types";
import { InvitationAuthorizationService } from "../../domain/services/invitation-authorization.service";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { InvitationEntity } from "../../domain/entities/invitation.entity";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";
import { InvitationSentEvent } from "../../domain/events/invitation-sent.event";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";

export class SendInvitationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly authorizationService: InvitationAuthorizationService,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly invitationRepository: IInvitationRepository,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {
    super(logger);
  }

  async execute(data: IInvitationCreate): Promise<IInvitation> {
    try {
      const emailVO = Email.create(data.email);

      const [inviter, organization] = await Promise.all([
        this.userRepository.findByIdWithActiveMemberships(data.invitedBy),
        this.organizationRepository.findById(data.organizationId),
      ]);

      if (!inviter) {
        throw new DomainError(
          ErrorCode.USER_NOT_FOUND,
          "Inviter not found",
          undefined,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (!organization) {
        throw new DomainError(
          ErrorCode.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          undefined,
          HTTP_STATUS.NOT_FOUND
        );
      }

      const existingUser = await this.userRepository.findByEmailWithActiveMemberships(
        emailVO.value
      );

      if (existingUser?.belongsToOrganization(organization.id)) {
        throw new DomainError(
          ErrorCode.USER_IS_ALREADY_MEMBER,
          "User is already a member of this organization",
          undefined,
          HTTP_STATUS.CONFLICT
        );
      }

      const pendingInvitation =
        await this.invitationRepository.findPendingByEmailAndOrg(
          emailVO.value,
          organization.id
        );

      if (pendingInvitation) {
        throw new DomainError(
          ErrorCode.INVITATION_ALREADY_SENT,
          "An invitation is already pending for this email",
          undefined,
          HTTP_STATUS.CONFLICT
        );
      }

      this.authorizationService.canUserInviteToOrganization(
        inviter,
        organization
      );

      this.authorizationService.validateInvitedRole(data.role);

      // Check if subscription is required for learning_manager invitations
      if (data.role === UserRole.LEARNING_MANAGER) {
        const activeSubscription =
          await this.subscriptionRepository.findActiveByOrganizationId(
            organization.id
          );

        if (!activeSubscription || activeSubscription.status === "pending") {
          throw new DomainError(
            ErrorCode.SUBSCRIPTION_REQUIRED_FOR_INVITATION,
            "An active subscription is required to invite learning managers. Please subscribe to a plan first.",
            undefined,
            HTTP_STATUS.FORBIDDEN
          );
        }
      }

      const invitation = InvitationEntity.create({
        email: emailVO.value,
        organizationId: organization.id,
        invitedBy: inviter.id,
        role: data.role,
      });

      const createdInvitation =
        await this.invitationRepository.create(invitation);
      if (!createdInvitation)
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during invitation creation. Please try again later."
        );

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
      const invitationLink = `${frontendUrl}/auth/accept-invitation?token=${createdInvitation.token}`;

      this.eventStore.publish(
        new InvitationSentEvent({
          email: createdInvitation.email,
          organizationName: organization.name,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          invitationLink,
          role: createdInvitation.role,
        })
      );

      return createdInvitation.toPersistance();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
