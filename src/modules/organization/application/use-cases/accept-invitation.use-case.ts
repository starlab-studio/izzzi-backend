import {
  BaseUseCase,
  DomainError,
  ErrorCode,
  IEventStore,
  ILoggerService,
  IUseCase,
  HTTP_STATUS,
} from "src/core";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipEntity } from "../../domain/entities/membership.entity";
import { InvitationAcceptedEvent } from "../../domain/events/invitation-accepted.event";

export type AcceptInvitationData = {
  token: string;
  userId: string;
};

export class AcceptInvitationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly invitationRepository: IInvitationRepository,
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository
  ) {
    super(logger);
  }

  async execute(data: AcceptInvitationData): Promise<void> {
    try {
      const invitation = await this.invitationRepository.findByToken(
        data.token
      );

      if (!invitation) {
        throw new DomainError(
          ErrorCode.INVALID_OR_EXPIRED_INVITATION,
          "Invalid invitation token",
          undefined,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (!invitation.isValid()) {
        throw new DomainError(
          ErrorCode.INVALID_OR_EXPIRED_INVITATION,
          invitation.isExpired()
            ? "Invitation has expired"
            : "Invitation is no longer valid",
          undefined,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const user = await this.userRepository.findByIdWithActiveMemberships(
        data.userId
      );

      if (!user) {
        throw new DomainError(
          ErrorCode.USER_NOT_FOUND,
          "User not found",
          undefined,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new DomainError(
          ErrorCode.INVALID_OR_EXPIRED_INVITATION,
          "Invitation email does not match user email",
          undefined,
          HTTP_STATUS.FORBIDDEN
        );
      }

      if (user.belongsToOrganization(invitation.organizationId)) {
        invitation.markAsAccepted();
        await this.invitationRepository.save(invitation);
        return;
      }

      const membership = MembershipEntity.create({
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        addedBy: invitation.invitedBy,
      });

      await this.membershipRepository.create(membership);

      invitation.markAsAccepted();
      await this.invitationRepository.save(invitation);

      this.eventStore.publish(
        new InvitationAcceptedEvent({
          userId: user.id,
          organizationId: invitation.organizationId,
          email: invitation.email,
        })
      );
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
