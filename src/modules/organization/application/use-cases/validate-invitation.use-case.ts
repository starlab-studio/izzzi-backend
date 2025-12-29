import {
  BaseUseCase,
  DomainError,
  ErrorCode,
  ILoggerService,
  IUseCase,
  IUnitOfWork,
  HTTP_STATUS,
} from "src/core";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipEntity } from "../../domain/entities/membership.entity";

export type ValidateInvitationData = {
  token: string;
};

export type ValidateInvitationResponse = {
  userExists: boolean;
  invitationEmail: string;
};

export class ValidateInvitationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly invitationRepository: IInvitationRepository,
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {
    super(logger);
  }

  async execute(
    data: ValidateInvitationData
  ): Promise<ValidateInvitationResponse> {
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

      const existingUser = await this.userRepository.findByEmail(
        invitation.email
      );

      if (!existingUser) {
        return {
          userExists: false,
          invitationEmail: invitation.email,
        };
      }

      const existingMembership =
        await this.membershipRepository.findByUserAndOrganization(
          existingUser.id,
          invitation.organizationId
        );

      const needsReactivation =
        existingUser.isDeleted() ||
        (existingMembership && !existingMembership.isActive()) ||
        !existingMembership;

      if (needsReactivation) {
        await this.unitOfWork.withTransaction(async () => {
          if (existingUser.isDeleted()) {
            existingUser.activate();
            await this.userRepository.save(existingUser);
          }

          if (existingMembership) {
            if (!existingMembership.isActive()) {
              existingMembership.reactivate(invitation.role);
              await this.membershipRepository.save(existingMembership);
              this.logger.info(
                `Reactivated membership for user ${existingUser.id} in organization ${invitation.organizationId}`
              );
            }
          } else {
            const membership = MembershipEntity.create({
              userId: existingUser.id,
              organizationId: invitation.organizationId,
              role: invitation.role,
              addedBy: invitation.invitedBy,
            });
            await this.membershipRepository.create(membership);
            this.logger.info(
              `Created new membership for user ${existingUser.id} in organization ${invitation.organizationId}`
            );
          }

          invitation.markAsAccepted();
          await this.invitationRepository.save(invitation);
        });
      }

      return {
        userExists: true,
        invitationEmail: invitation.email,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
