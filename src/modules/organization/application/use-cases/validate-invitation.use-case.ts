import {
  BaseUseCase,
  DomainError,
  ErrorCode,
  ILoggerService,
  IUseCase,
  HTTP_STATUS,
} from "src/core";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";

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
    private readonly userRepository: IUserRepository
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

      return {
        userExists: !!existingUser,
        invitationEmail: invitation.email,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
