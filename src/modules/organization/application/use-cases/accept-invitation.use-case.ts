import {
  BaseUseCase,
  DomainError,
  ErrorCode,
  IEventStore,
  ILoggerService,
  IUnitOfWork,
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
    private readonly membershipRepository: IMembershipRepository,
    private readonly unitOfWork: IUnitOfWork,
  ) {
    super(logger);
  }

  async execute(data: AcceptInvitationData): Promise<void> {
    try {
      return await this.unitOfWork.withTransaction(async () => {
        const invitation = await this.invitationRepository.findByToken(
          data.token,
        );

        if (!invitation) {
          throw new DomainError(
            ErrorCode.INVALID_OR_EXPIRED_INVITATION,
            "Invalid invitation token",
            undefined,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const user = await this.userRepository.findById(data.userId);

        if (!user) {
          throw new DomainError(
            ErrorCode.USER_NOT_FOUND,
            "User not found",
            undefined,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (!invitation.isValid()) {
          if (invitation.isExpired()) {
            throw new DomainError(
              ErrorCode.INVALID_OR_EXPIRED_INVITATION,
              "Invitation has expired",
              undefined,
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          const existingMembership =
            await this.membershipRepository.findByUserAndOrganization(
              user.id,
              invitation.organizationId,
            );

          if (existingMembership && existingMembership.isActive()) {
            this.logger.info(
              `Invitation already accepted for user ${user.id}, membership already active`,
            );
            return;
          }

          throw new DomainError(
            ErrorCode.INVALID_OR_EXPIRED_INVITATION,
            "Invitation is no longer valid",
            undefined,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
          throw new DomainError(
            ErrorCode.INVALID_OR_EXPIRED_INVITATION,
            "Invitation email does not match user email",
            undefined,
            HTTP_STATUS.FORBIDDEN,
          );
        }

        if (user.isDeleted()) {
          user.activate();
          await this.userRepository.save(user);
          this.logger.info(
            `Reactivated deleted user ${user.id} via invitation`,
          );
        }

        const existingMembership =
          await this.membershipRepository.findByUserAndOrganization(
            user.id,
            invitation.organizationId,
          );

        if (existingMembership) {
          if (existingMembership.isActive()) {
            invitation.markAsAccepted();
            await this.invitationRepository.save(invitation);
            return;
          }

          existingMembership.reactivate(invitation.role);
          await this.membershipRepository.save(existingMembership);
          this.logger.info(
            `Reactivated membership ${existingMembership.id} for user ${user.id}`,
          );
        } else {
          const membership = MembershipEntity.create({
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            addedBy: invitation.invitedBy,
          });

          await this.membershipRepository.create(membership);
        }

        invitation.markAsAccepted();
        await this.invitationRepository.save(invitation);

        this.eventStore.publish(
          new InvitationAcceptedEvent({
            userId: user.id,
            organizationId: invitation.organizationId,
            email: invitation.email,
          }),
        );
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(_input: unknown): Promise<void> {}
}
