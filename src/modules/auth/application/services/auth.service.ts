import { SignUpData, SignUpResponse } from "../../domain/types";

import {
  IEventStore,
  ILoggerService,
  DomainError,
  ErrorCode,
  HTTP_STATUS,
} from "src/core";
import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { SignUpSucceedEvent } from "../../domain/events/signUpSucceedEvent.event";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";

export class AuthService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly signUpUseCase: SignUpUseCase,
    private readonly authIdentityRepository: IAuthIdentityRepository,
  ) {}

  async signUp(
    organizationFacade: OrganizationFacade,
    data: SignUpData,
  ): Promise<SignUpResponse | undefined> {
    try {
      const signUpResponse = await this.signUpUseCase.execute(data);
      const user =
        await organizationFacade.createUserAndOrganization(signUpResponse);

      const authIdentity = await this.authIdentityRepository.findById(
        signUpResponse.authIdentityId,
      );
      if (!authIdentity) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "AuthIdentity not found after creation",
          undefined,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      authIdentity.setUser(user.id);
      await this.authIdentityRepository.save(authIdentity);

      const sendVerificationToken = signUpResponse.sendVerificationToken;
      const verificationLink = `http://www.localhost:3001/auth/email-verification?token=${signUpResponse.verificationToken}`; // TODO : Remove hardcode frontend link to use dynamic value

      this.eventStore.publish(
        new SignUpSucceedEvent({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          verificationLink,
          sendVerificationToken,
        }),
      );
      return signUpResponse;
    } catch (error) {
      this.logger.error(`Something went wrong : ${error}`, "auth/service");
      throw error;
    }
  }
}
