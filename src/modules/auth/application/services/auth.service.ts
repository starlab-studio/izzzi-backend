import { BaseService, IEventStore, ILoggerService } from "src/core";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import {
  IAuthIdentity,
  IAuthStrategy,
  SignUpData,
  SignUpResponse,
} from "../../domain/types";
import { AuthIdentityCreatedEvent } from "../events/AuthIdentityCreated.event";

export class AuthService extends BaseService {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: IEventStore,
    private readonly repository: IAuthIdentityRepository,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async signUp(data: SignUpData): Promise<SignUpResponse> {
    try {
      const response = await this.authProvider.signUp(data);
      this.assert(!!response, "User resgistration fails");

      const { password, ...dataWithoutPassword } = data;
      const userData = { ...dataWithoutPassword, ...response };

      await this.createAuthIdentity(userData);
      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createAuthIdentity(data: SignUpResponse): Promise<IAuthIdentity> {
    try {
      const createdIdentity = await this.repository.create({
        provider: data.provider,
        provider_user_id: data.provider_user_id,
      });
      this.assert(!!createdIdentity, "User identity creation fails");

      this.eventStore.publish(new AuthIdentityCreatedEvent(data));
      return createdIdentity;
    } catch (error) {
      this.handleError(error);
    }
  }
}
