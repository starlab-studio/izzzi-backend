import {
  BaseUseCase,
  DomainError,
  ErrorCode,
  IEventStore,
  ILoggerService,
  IUseCase,
  HTTP_STATUS,
  Email,
} from "src/core";
import { IAuthStrategy, SignUpData, SignUpResponse } from "../../domain/types";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { InvitationAcceptedEvent } from "src/modules/organization/domain/events/invitation-accepted.event";

export type SignUpFromInvitationData = {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export class SignUpFromInvitationUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly authProvider: IAuthStrategy,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(data: SignUpFromInvitationData): Promise<SignUpResponse> {
    try {
      const invitation = await this.organizationFacade.findInvitationByToken(
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

      if (
        Email.create(data.email).value !== Email.create(invitation.email).value
      ) {
        throw new DomainError(
          ErrorCode.INVALID_OR_EXPIRED_INVITATION,
          "Email does not match the invitation email",
          undefined,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const userExists = await this.organizationFacade.checkUserExistsByEmail(
        invitation.email
      );

      if (userExists) {
        throw new DomainError(
          ErrorCode.USER_ALREADY_EXISTS,
          "User with this email already exists. Please sign in and accept the invitation.",
          undefined,
          HTTP_STATUS.CONFLICT
        );
      }

      const signUpData: SignUpData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: invitation.email,
        password: data.password,
        organization: "",
      };

      const signUpResponse = await this.authProvider.signUp(signUpData);

      const user = await this.organizationFacade.createUserAndAcceptInvitation({
        userData: {
          firstName: signUpResponse.firstName,
          lastName: signUpResponse.lastName,
          email: signUpResponse.email,
          authIdentityId: signUpResponse.authIdentityId,
          organization: "",
        },
        invitationToken: data.token,
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      });

      const authIdentity = await this.authIdentityRepository.findById(
        signUpResponse.authIdentityId
      );
      if (!authIdentity) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "AuthIdentity not found after creation",
          undefined,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      authIdentity.setUser(user.id);
      authIdentity.verifyEmail(invitation.email);
      await this.authIdentityRepository.save(authIdentity);

      this.eventStore.publish(
        new InvitationAcceptedEvent({
          userId: user.id,
          organizationId: invitation.organizationId,
          email: invitation.email,
          firstName: user.firstName,
        })
      );

      return signUpResponse;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
