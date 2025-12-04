import { SignUpData, SignUpResponse } from "../../domain/types";

import { IEventStore, ILoggerService } from "src/core";
import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { SignUpSucceedEvent } from "../../domain/events/signUpSucceedEvent.event";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class AuthService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly signUpUseCase: SignUpUseCase
  ) {}

  async signUp(
    organizationFacade: OrganizationFacade,
    data: SignUpData
  ): Promise<SignUpResponse | undefined> {
    try {
      const signUpResponse = await this.signUpUseCase.execute(data);
      const user =
        await organizationFacade.createUserAndOrganization(signUpResponse);

      const sendVerificationToken = signUpResponse.sendVerificationToken;
      const verificationLink = `http://www.localhost:3001/auth/email-verification?token=${signUpResponse.verificationToken}`; // TODO : Remove hardcode frontend link to use dynamic value

      this.eventStore.publish(
        new SignUpSucceedEvent({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          verificationLink,
          sendVerificationToken,
        })
      );
      return signUpResponse;
    } catch (error) {
      this.logger.error(`Something went wrong : ${error}`, "auth/service");
      throw error;
    }
  }
}
